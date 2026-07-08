import pytest
import uuid
from fastapi import status, HTTPException
from app.core.rbac import PermissionChecker, ROLE_PERMISSIONS
from app.exceptions import AppException


@pytest.mark.asyncio
async def test_rbac_owner_has_all_permissions():
    checker = PermissionChecker("org:delete")
    payload = {"sub": str(uuid.uuid4()), "role": "Owner", "org_id": str(uuid.uuid4())}
    result = checker(payload)
    assert result["role"] == "Owner"


@pytest.mark.asyncio
async def test_rbac_analyst_cannot_delete_org():
    checker = PermissionChecker("org:delete")
    payload = {"sub": str(uuid.uuid4()), "role": "Analyst", "org_id": str(uuid.uuid4())}
    with pytest.raises(AppException) as exc_info:
        checker(payload)
    assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
    assert "do not have permission" in exc_info.value.message


@pytest.mark.asyncio
async def test_rbac_developer_can_access_api_keys():
    checker = PermissionChecker("apikey:write")
    payload = {"sub": str(uuid.uuid4()), "role": "Developer", "org_id": str(uuid.uuid4())}
    result = checker(payload)
    assert result["role"] == "Developer"


@pytest.mark.asyncio
async def test_invalid_role_rejected():
    checker = PermissionChecker("predict:realtime")
    payload = {"sub": str(uuid.uuid4()), "role": "Hacker", "org_id": str(uuid.uuid4())}
    with pytest.raises(AppException) as exc_info:
        checker(payload)
    assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
