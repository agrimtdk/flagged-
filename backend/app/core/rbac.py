import logging
from typing import Dict, Set, Any
from fastapi import Depends, Header, status
from app.core.security import decode_token
from app.core.redis import redis_manager
from app.exceptions import AppException

logger = logging.getLogger("app.core.rbac")

# Role-Permission Mapping Matrix (Exactly matching SDD specification)
ROLE_PERMISSIONS: Dict[str, Set[str]] = {
    "Owner": {
        "org:delete",
        "org:write",
        "user:invite",
        "apikey:write",
        "apikey:read",
        "csv:upload",
        "predict:realtime",
        "analytics:read"
    },
    "Admin": {
        "org:write",
        "user:invite",
        "apikey:write",
        "apikey:read",
        "csv:upload",
        "predict:realtime",
        "analytics:read"
    },
    "Analyst": {
        "csv:upload",
        "predict:realtime",
        "analytics:read"
    },
    "Developer": {
        "apikey:write",
        "apikey:read",
        "predict:realtime",
        "analytics:read"
    }
}


async def get_current_user_claims(authorization: str = Header(..., description="Bearer JWT access token")) -> Dict[str, Any]:
    """
    Dependency extracting and validating JWT claims from request headers.
    """
    if not authorization.startswith("Bearer "):
        raise AppException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="UNAUTHORIZED",
            message="Invalid Authorization header format. Use Bearer <token>."
        )

    token = authorization.split(" ")[1]
    
    try:
        payload = decode_token(token)
    except Exception as e:
        logger.warning(f"JWT verification failed: {e}")
        raise AppException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="UNAUTHORIZED",
            message="Your authentication token is invalid or expired."
        )

    # Check Token Revocation (Blacklisted JTI)
    jti = payload.get("jti")
    if jti:
        is_blacklisted = await redis_manager.get(f"revoked:jti:{jti}")
        if is_blacklisted:
            raise AppException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                code="UNAUTHORIZED",
                message="Your session has been signed out. Please log in again."
            )

    return payload


async def get_current_user_or_apikey_claims(
    authorization: str = Header(..., description="Bearer JWT token or API Key"),
    db: Any = Depends(lambda: None)  # Will be resolved below dynamically or via dependency injection
) -> Dict[str, Any]:
    """
    Dual-authentication dependency.
    Tries decoding as a standard JWT first.
    If that fails, hashes the token and queries API Key registry (cached in Redis).
    """
    if not authorization.startswith("Bearer "):
        raise AppException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="UNAUTHORIZED",
            message="Invalid Authorization header format. Use Bearer <token>."
        )

    token = authorization.split(" ")[1]

    # 1. Try decoding as JWT
    try:
        payload = decode_token(token)
        # Check token revocation (blacklisted JTI)
        jti = payload.get("jti")
        if jti:
            is_blacklisted = await redis_manager.get(f"revoked:jti:{jti}")
            if is_blacklisted:
                raise AppException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    code="UNAUTHORIZED",
                    message="Your session has been signed out."
                )
        return payload
    except Exception:
        # JWT failed or expired, proceed to validate as API Key
        pass

    # 2. Try validating as API key
    from app.core.security import hash_token
    from app.repositories.api_key import ApiKeyRepository
    from app.core.database import get_db
    import json

    key_hash = hash_token(token)
    redis_key = f"apikey:validation:{key_hash}"

    # Check cache
    cached_val = await redis_manager.get(redis_key)
    if cached_val:
        if cached_val == "invalid":
            raise AppException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                code="UNAUTHORIZED",
                message="Your API Key is invalid or deactivated."
            )
        try:
            data = json.loads(cached_val)
            data["key_hash"] = key_hash
            return data
        except Exception:
            pass

    # Cache miss: query database
    # Resolve DB session dynamically if not injected directly
    async for session in get_db():
        repo = ApiKeyRepository(session)
        api_key = await repo.get_by_hash(key_hash)
        
        if not api_key or not api_key.is_active:
            # Cache failure for 5 minutes
            await redis_manager.set(redis_key, "invalid", ex=300)
            raise AppException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                code="UNAUTHORIZED",
                message="Your API Key is invalid or deactivated."
            )

        from datetime import datetime, timezone
        api_key.last_used_at = datetime.now(timezone.utc)
        await session.commit()

        # Synthetic claims
        claims = {
            "sub": "api_key",
            "org_id": str(api_key.organization_id),
            "role": "Developer",
            "source": "api_key",
            "key_hash": key_hash
        }

        # Cache valid claims for 5 minutes (300s)
        await redis_manager.set(redis_key, json.dumps(claims), ex=300)
        return claims

    raise AppException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        code="UNAUTHORIZED",
        message="Authentication failed."
    )


class PermissionChecker:
    def __init__(self, required_permission: str, allow_apikey: bool = False):
        self.required_permission = required_permission
        self.allow_apikey = allow_apikey

    def __call__(self, payload: Dict[str, Any] = Depends(get_current_user_claims)) -> Dict[str, Any]:
        role = payload.get("role")
        if not role or role not in ROLE_PERMISSIONS:
            logger.warning(f"User role '{role}' is not registered in RBAC matrix.")
            raise AppException(
                status_code=status.HTTP_403_FORBIDDEN,
                code="FORBIDDEN",
                message="Access forbidden. Assigned role is invalid."
            )

        allowed_permissions = ROLE_PERMISSIONS[role]
        if self.required_permission not in allowed_permissions:
            logger.warning(f"Access Denied: Role '{role}' lacks permission '{self.required_permission}'.")
            raise AppException(
                status_code=status.HTTP_403_FORBIDDEN,
                code="FORBIDDEN",
                message=f"Access forbidden. You do not have permission: '{self.required_permission}'."
            )

        return payload


def requires_permission(permission: str):
    """
    Dependency helper verifying active user permissions.
    """
    return Depends(PermissionChecker(permission))


def requires_prediction_permission():
    """
    Special dependency helper for predicting real-time results.
    Accepts standard JWT OR API Key and validates RBAC + distributed Rate Limiting.
    """
    async def dependency(claims: Dict[str, Any] = Depends(get_current_user_or_apikey_claims)) -> Dict[str, Any]:
        role = claims.get("role")
        if not role or role not in ROLE_PERMISSIONS:
            raise AppException(
                status_code=status.HTTP_403_FORBIDDEN,
                code="FORBIDDEN",
                message="Access forbidden."
            )
        
        allowed_permissions = ROLE_PERMISSIONS[role]
        if "predict:realtime" not in allowed_permissions:
            raise AppException(
                status_code=status.HTTP_403_FORBIDDEN,
                code="FORBIDDEN",
                message="Access forbidden. Lacks real-time prediction permission."
            )
            
        # Enforce rate limiting per organization (600 requests per minute)
        org_id = claims.get("org_id", "default")
        is_allowed = await redis_manager.check_rate_limit(
            key=f"ratelimit:predict:{org_id}", max_requests=600, window_seconds=60
        )
        if not is_allowed:
            raise AppException(
                status_code=429,
                code="TOO_MANY_REQUESTS",
                message="Rate limit exceeded for real-time predictions. Maximum 600 requests per minute per organization."
            )
            
        return claims
    return Depends(dependency)


