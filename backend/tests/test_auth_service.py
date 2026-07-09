import pytest
from app.services.auth_service import AuthService
from app.repositories.organization import OrganizationRepository
from app.repositories.user import UserRepository


@pytest.mark.asyncio
async def test_organization_bootstrapping_and_login(db_session):
    auth_service = AuthService(db_session)
    org_repo = OrganizationRepository(db_session)
    user_repo = UserRepository(db_session)
    
    email = "admin@acme.com"
    mock_code = f"mock_code_{email}"
    
    # 1. Onboard first-time user (Expect new organization bootstrap)
    access_1, refresh_1, user_1 = await auth_service.login_with_google(mock_code)
    
    assert access_1 is not None
    assert user_1.email == email
    assert user_1.role == "Owner"
    
    # Verify organization exists in DB
    org_1 = await org_repo.get(user_1.organization_id)
    assert org_1 is not None
    assert org_1.name == "Acme Corporation"
    
    # 2. Login subsequent time (Expect same user and organization reused)
    access_2, refresh_2, user_2 = await auth_service.login_with_google(mock_code)
    
    assert user_2.id == user_1.id
    assert user_2.organization_id == user_1.organization_id
    
    # Confirm no new organizations were created
    all_orgs = await org_repo.get_all()
    assert len(all_orgs) == 1


@pytest.mark.asyncio
async def test_update_user_profile(db_session):
    from app.services.user_service import UserService
    auth_service = AuthService(db_session)
    user_service = UserService(db_session)

    email = "editor@acme.com"
    mock_code = f"mock_code_{email}"
    _, _, user = await auth_service.login_with_google(mock_code)

    updated_user = await user_service.update_user_profile(user.id, "Agrim Sharma")
    assert updated_user is not None
    assert updated_user.full_name == "Agrim Sharma"
