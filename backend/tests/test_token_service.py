import pytest
from app.services.token_service import TokenService
from app.exceptions import AppException
from app.repositories.refresh_token import RefreshTokenRepository
from app.models.organization import Organization
from app.models.user import User


@pytest.mark.asyncio
async def test_refresh_token_rotation_and_replay_attack(db_session):
    # Setup mock Org and User
    org = Organization(name="Test Org")
    db_session.add(org)
    await db_session.flush()
    
    user = User(
        organization_id=org.id,
        email="test@acme.com",
        full_name="Test User",
        role="Admin"
    )
    db_session.add(user)
    await db_session.flush()
    
    token_service = TokenService(db_session)
    ref_repo = RefreshTokenRepository(db_session)
    
    # 1. Create session
    access, refresh = await token_service.create_session(str(user.id), str(org.id), user.role)
    assert access is not None
    assert refresh is not None
    
    # 2. Perform rotation (First usage - clean)
    new_access, new_refresh = await token_service.rotate_refresh_token(refresh, user.role, str(org.id))
    assert new_access is not None
    assert new_refresh is not None
    assert new_refresh != refresh
    
    # Verify old token is marked as used
    from app.core.security import hash_token
    old_hash = hash_token(refresh)
    old_token_record = await ref_repo.get_by_hash(old_hash)
    assert old_token_record.is_used is True
    assert old_token_record.is_revoked is False
    
    # 3. Simulate Replay Attack (Using the old token a second time)
    with pytest.raises(AppException) as exc_info:
        await token_service.rotate_refresh_token(refresh, user.role, str(org.id))
        
    assert exc_info.value.code == "REPLAY_ATTACK_DETECTED"
    assert exc_info.value.status_code == 401
    
    # Verify ALL refresh tokens for the user are now marked as revoked
    new_hash = hash_token(new_refresh)
    new_token_record = await ref_repo.get_by_hash(new_hash)
    assert new_token_record.is_revoked is True
