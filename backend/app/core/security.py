import hmac
import uuid
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Tuple
import jwt
from app.core.config import settings

# Symmetric Keys Registry to support key rotation
KEYS_REGISTRY: Dict[str, str] = {
    "k1": settings.JWT_SECRET, # Active primary key
    "k2": settings.JWT_SECRET + "_backup"
}
ACTIVE_KID = "k1"

ISSUER = "flagged!"
AUDIENCE = "flagged!"


def hash_token(token: str) -> str:
    """
    Computes SHA-256 hash of a string.
    """
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def verify_hash_constant_time(val1: str, val2: str) -> bool:
    """
    Constant-time comparison to prevent timing attacks.
    """
    return hmac.compare_digest(val1.encode("utf-8"), val2.encode("utf-8"))


def generate_jti() -> str:
    """
    Generates a unique token ID.
    """
    return str(uuid.uuid4())


def create_access_token(user_id: str, org_id: str, role: str) -> Tuple[str, str]:
    """
    Generates a short-lived access JWT token.
    Returns: Tuple of (token_string, jti)
    """
    now = datetime.now(timezone.utc)
    jti = generate_jti()
    
    payload = {
        "iss": ISSUER,
        "aud": AUDIENCE,
        "iat": now,
        "nbf": now,
        "exp": now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        "jti": jti,
        "sub": user_id,
        "org_id": org_id,
        "role": role
    }
    
    # Sign with headers containing kid (Key ID) for rotation
    headers = {"kid": ACTIVE_KID}
    
    token = jwt.encode(
        payload,
        KEYS_REGISTRY[ACTIVE_KID],
        algorithm=settings.JWT_ALGORITHM,
        headers=headers
    )
    return token, jti


def create_refresh_token(user_id: str) -> Tuple[str, str]:
    """
    Generates a long-lived refresh JWT token.
    Returns: Tuple of (token_string, jti)
    """
    now = datetime.now(timezone.utc)
    jti = generate_jti()
    
    payload = {
        "iss": ISSUER,
        "aud": AUDIENCE,
        "iat": now,
        "nbf": now,
        "exp": now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        "jti": jti,
        "sub": user_id,
        "type": "refresh"
    }
    
    headers = {"kid": ACTIVE_KID}
    
    token = jwt.encode(
        payload,
        KEYS_REGISTRY[ACTIVE_KID],
        algorithm=settings.JWT_ALGORITHM,
        headers=headers
    )
    return token, jti


def decode_token(token: str) -> Dict[str, Any]:
    """
    Decodes and validates a JWT token checking key rotation and standard claims.
    Raises jwt.PyJWTError on failure.
    """
    # Unverified decode to extract kid from headers
    unverified_header = jwt.get_unverified_header(token)
    kid = unverified_header.get("kid", "k1")
    
    if kid not in KEYS_REGISTRY:
        raise jwt.InvalidKeyError("Key ID not found in security registry.")
        
    key = KEYS_REGISTRY[kid]
    
    # Verify standard claims
    payload = jwt.decode(
        token,
        key,
        algorithms=[settings.JWT_ALGORITHM],
        audience=AUDIENCE,
        issuer=ISSUER,
        options={"require": ["iss", "aud", "exp", "iat", "sub", "jti"]}
    )
    return payload
