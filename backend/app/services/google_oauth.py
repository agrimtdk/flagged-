import logging
import httpx
import jwt
from typing import Dict, Any, Optional
from app.core.config import settings
from app.exceptions import AppException

logger = logging.getLogger("app.services.google_oauth")

GOOGLE_CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"


class GoogleOAuthService:
    def __init__(self):
        self.cached_certs: Dict[str, Any] = {}

    async def _get_google_public_key(self, kid: str) -> Any:
        """
        Fetches Google public certificates and extracts the matching key.
        """
        if kid in self.cached_certs:
            return self.cached_certs[kid]
            
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(GOOGLE_CERTS_URL)
                response.raise_for_status()
                certs_data = response.json()
            except Exception as e:
                logger.error(f"Failed to fetch Google public certs: {e}")
                raise AppException(
                    status_code=502,
                    code="OAUTH_PROVIDER_ERROR",
                    message="Failed to contact Google identity provider."
                )

        # Build PyJWK Set
        jwks = certs_data.get("keys", [])
        for key_data in jwks:
            self.cached_certs[key_data["kid"]] = key_data
            
        if kid not in self.cached_certs:
            raise AppException(
                status_code=401,
                code="INVALID_OAUTH_TOKEN",
                message="Google signing certificate key ID mismatch."
            )
            
        return self.cached_certs[kid]

    async def verify_id_token(self, id_token: str) -> Dict[str, Any]:
        """
        Verifies Google's signature and claims on the ID token.
        """
        try:
            headers = jwt.get_unverified_header(id_token)
            kid = headers.get("kid")
            if not kid:
                raise ValueError("Missing kid header in Google ID Token.")
                
            jwk = await self._get_google_public_key(kid)
            
            # Construct public key object
            public_key = jwt.algorithms.RSAAlgorithm.from_jwk(jwk)
            
            # Decode and verify token
            payload = jwt.decode(
                id_token,
                public_key,
                algorithms=["RS256"],
                audience=settings.GOOGLE_CLIENT_ID,
                issuer="https://accounts.google.com"
            )
            
            # Ensure email is verified
            if not payload.get("email_verified", False):
                raise AppException(
                    status_code=400,
                    code="UNVERIFIED_EMAIL",
                    message="Your Google account email is not verified."
                )
                
            return {
                "email": payload["email"],
                "full_name": payload.get("name", "Google User"),
                "avatar_url": payload.get("picture")
            }
            
        except jwt.PyJWTError as e:
            logger.warning(f"Google ID Token signature match failed: {e}")
            raise AppException(
                status_code=401,
                code="INVALID_OAUTH_TOKEN",
                message="Google token signature is invalid."
            )

    async def exchange_code_and_get_user(self, code: str, redirect_uri: Optional[str] = None) -> Dict[str, Any]:
        """
        Exchanges authorization code for Google user details.
        """
        # Developer/Testing Local Sandbox Mock Fallback
        if code.startswith("mock_code_") and (settings.ENV != "production" or settings.GOOGLE_CLIENT_ID == "placeholder-google-client-id"):
            mock_email = code.replace("mock_code_", "")
            logger.info(f"Sandbox Developer Login requested for: {mock_email}")
            return {
                "email": mock_email,
                "full_name": mock_email.split("@")[0].title() + " (Mock)",
                "avatar_url": "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp"
            }

        # Real Google OAuth token exchange
        async with httpx.AsyncClient() as client:
            try:
                # Redirect URL is generally determined on the client side 
                # but must match the one configured in consent console
                # (Google requires redirect_uri parameter)
                data = {
                    "code": code,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "redirect_uri": redirect_uri or "postmessage",
                    "grant_type": "authorization_code"
                }
                
                response = await client.post(GOOGLE_TOKEN_URL, data=data)
                if response.status_code != 200:
                    logger.error(f"Google token error response: {response.text}")
                response.raise_for_status()
                token_data = response.json()
                
            except Exception as e:
                logger.error(f"Google token exchange endpoint error: {e}")
                raise AppException(
                    status_code=400,
                    code="OAUTH_EXCHANGE_FAILED",
                    message="Failed to exchange code with Google OAuth servers."
                )

        id_token = token_data.get("id_token")
        if not id_token:
            raise AppException(
                status_code=400,
                code="OAUTH_TOKEN_MISSING",
                message="ID Token missing in Google callback payload."
            )
            
        return await self.verify_id_token(id_token)


# Global OAuth service instance
google_oauth_service = GoogleOAuthService()
