import uuid
import pytest
from unittest.mock import AsyncMock, patch
from app.models.organization import Organization
from app.repositories.api_key import ApiKeyRepository
from app.routers.api_keys import (
    list_api_keys,
    create_api_key,
    rename_api_key,
    toggle_api_key_status,
    delete_api_key,
)
from app.schemas.api_key import ApiKeyCreate, ApiKeyRename, ApiKeyStatusToggle
from app.exceptions import AppException


@pytest.mark.asyncio
async def test_api_key_crud_lifecycle(db_session):
    org_id = uuid.uuid4()
    org = Organization(id=org_id, name="Test Org")
    db_session.add(org)
    await db_session.flush()

    claims = {"org_id": str(org_id), "role": "Admin", "sub": "test_user"}

    # 1. Create API Key
    payload_create = ApiKeyCreate(name="Production Server Key")
    created = await create_api_key(payload_create, db=db_session, claims=claims)
    assert created.name == "Production Server Key"
    assert created.secret_key.startswith("fl_live_")
    assert created.is_active is True

    # 2. List API Keys
    keys = await list_api_keys(db=db_session, claims=claims)
    assert len(keys) == 1
    assert keys[0].id == created.id
    assert keys[0].name == "Production Server Key"

    # 3. Rename API Key
    payload_rename = ApiKeyRename(name="Staging Server Key")
    renamed = await rename_api_key(created.id, payload_rename, db=db_session, claims=claims)
    assert renamed.name == "Staging Server Key"

    # 4. Toggle Status
    with patch("app.core.redis.redis_manager.delete", new_callable=AsyncMock) as mock_delete:
        payload_status = ApiKeyStatusToggle(is_active=False)
        toggled = await toggle_api_key_status(created.id, payload_status, db=db_session, claims=claims)
        assert toggled.is_active is False
        mock_delete.assert_called_once()

    # 5. Delete API Key
    with patch("app.core.redis.redis_manager.delete", new_callable=AsyncMock) as mock_delete_2:
        res = await delete_api_key(created.id, db=db_session, claims=claims)
        assert res is None
        mock_delete_2.assert_called_once()

    # Verify deletion
    keys_after = await list_api_keys(db=db_session, claims=claims)
    assert len(keys_after) == 0

    # Clean up created organization so subsequent tests see clean DB
    await db_session.delete(org)
    await db_session.commit()


