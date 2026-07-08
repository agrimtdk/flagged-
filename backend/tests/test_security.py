import pytest
import jwt
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_token,
    verify_hash_constant_time
)


def test_jwt_generation_and_verification():
    user_id = "user-123"
    org_id = "org-456"
    role = "Admin"
    
    # Generate tokens
    access, access_jti = create_access_token(user_id, org_id, role)
    refresh, refresh_jti = create_refresh_token(user_id)
    
    assert access is not None
    assert refresh is not None
    assert access_jti != refresh_jti
    
    # Decode access token
    payload = decode_token(access)
    assert payload["sub"] == user_id
    assert payload["org_id"] == org_id
    assert payload["role"] == role
    assert payload["iss"] == "flagged!"
    assert payload["aud"] == "flagged!"
    assert payload["jti"] == access_jti
    
    # Decode refresh token
    ref_payload = decode_token(refresh)
    assert ref_payload["sub"] == user_id
    assert ref_payload["jti"] == refresh_jti
    assert ref_payload["type"] == "refresh"


def test_token_decoding_invalid_signature():
    # Attempt decoding corrupted token
    with pytest.raises(jwt.PyJWTError):
        decode_token("invalid.jwt.token.signature")


def test_constant_time_comparison():
    val = "super_secret_value"
    val_hash = hash_token(val)
    matching_hash = hash_token(val)
    different_hash = hash_token("other_value")
    
    assert verify_hash_constant_time(val_hash, matching_hash) is True
    assert verify_hash_constant_time(val_hash, different_hash) is False
