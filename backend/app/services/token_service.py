import logging
import uuid
from datetime import datetime, timezone
import jwt
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token, hash_token, decode_token
from app.core.redis import redis_manager
from app.models.refresh_token import RefreshToken
from app.repositories.refresh_token import RefreshTokenRepository
from app.exceptions import AppException
from typing import Tuple, Optional

logger = logging.getLogger("app.services.token")


class TokenService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.refresh_token_repo = RefreshTokenRepository(db)

    async def create_session(self, user_id: str, org_id: str, role: str) -> Tuple[str, str]:
        """
        Creates a new user session: generates JWT access token and refresh token,
        hashes the refresh token, and stores it in the database.
        Returns: Tuple of (access_token, raw_refresh_token)
        """
        access_token, _ = create_access_token(user_id, org_id, role)
        raw_refresh, refresh_jti = create_refresh_token(user_id)
        
        # Parse expiration claim from refresh token
        decoded = decode_token(raw_refresh)
        exp_timestamp = decoded["exp"]
        expires_at = datetime.fromtimestamp(exp_timestamp, timezone.utc)

        # Store SHA-256 hash of refresh token
        ref_hash = hash_token(raw_refresh)
        db_token = RefreshToken(
            user_id=uuid.UUID(decoded["sub"]),
            token_hash=ref_hash,
            expires_at=expires_at,
            is_used=False,
            is_revoked=False
        )
        self.refresh_token_repo.create(db_token)
        await self.db.flush() # Sync with DB (commits are in service/router boundary)
        
        return access_token, raw_refresh

    async def rotate_refresh_token(self, raw_token: str, user_role: str, org_id: str) -> Tuple[str, str]:
        """
        Enforces Refresh Token Rotation (RTR) and checks for replay attacks.
        Returns: Tuple of (new_access_token, new_refresh_token)
        """
        try:
            payload = decode_token(raw_token)
            if payload.get("type") != "refresh":
                raise ValueError("Not a refresh token.")
        except Exception as e:
            logger.warning(f"Refresh Token rotation fail - invalid token: {e}")
            raise AppException(401, "UNAUTHORIZED", "Session token is invalid or expired.")

        user_id = payload["sub"]
        token_hash = hash_token(raw_token)
        
        db_token = await self.refresh_token_repo.get_by_hash(token_hash)
        if not db_token or db_token.is_revoked:
            raise AppException(401, "UNAUTHORIZED", "Session token is invalid or revoked.")

        # Replay Attack Detection
        if db_token.is_used:
            logger.warning(
                f"REPLAY ATTACK DETECTED: Refresh token was already used! Revoking all sessions for User: {user_id}"
            )
            # Invalidate all refresh tokens for this user
            await self.refresh_token_repo.revoke_all_for_user(db_token.user_id)
            await self.db.flush()
            raise AppException(
                status_code=401,
                code="REPLAY_ATTACK_DETECTED",
                message="This session has already been used. For security, all active sessions are revoked."
            )

        # Verify Expiry manually just in case
        now = datetime.now(timezone.utc)
        if db_token.expires_at.replace(tzinfo=timezone.utc) < now:
            raise AppException(401, "UNAUTHORIZED", "Session token has expired.")

        # Mark token as used
        db_token.is_used = True
        self.refresh_token_repo.update(db_token)
        await self.db.flush()

        # Create a brand new session (Access + Refresh rotation)
        new_access, new_refresh = await self.create_session(str(user_id), org_id, user_role)
        return new_access, new_refresh

    async def revoke_session(self, raw_token: str, access_token: Optional[str] = None) -> None:
        """
        Revokes a session by invalidating the refresh token and blacklisting the access token.
        """
        # Revoke refresh token
        try:
            payload = decode_token(raw_token)
            token_hash = hash_token(raw_token)
            db_token = await self.refresh_token_repo.get_by_hash(token_hash)
            if db_token:
                db_token.is_revoked = True
                self.refresh_token_repo.update(db_token)
                await self.db.flush()
        except Exception:
            # Bypass issues to complete logout flows
            pass

        # Blacklist Access Token JTI in Redis (graceful fallback)
        if access_token:
            try:
                acc_payload = decode_token(access_token)
                jti = acc_payload.get("jti")
                exp = acc_payload.get("exp")
                if jti and exp:
                    now = datetime.now(timezone.utc).timestamp()
                    ttl = int(max(0, exp - now))
                    # Store blacklist state in Redis with token TTL
                    await redis_manager.set(f"revoked:jti:{jti}", "1", ex=ttl)
            except Exception as e:
                logger.warning(f"Failed to blacklist access token JTI in Redis: {e}")
