import secrets
import uuid
import logging
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rbac import requires_permission
from app.core.security import hash_token
from app.core.redis import redis_manager
from app.core.config import settings
from app.exceptions import AppException
from app.models.api_key import ApiKey
from app.repositories.api_key import ApiKeyRepository
from app.schemas.api_key import (
    ApiKeyResponse,
    ApiKeyCreate,
    ApiKeyCreateResponse,
    ApiKeyRename,
    ApiKeyStatusToggle,
)

logger = logging.getLogger("app.routers.api_keys")
router = APIRouter(prefix="/api-keys", tags=["API Keys"])


@router.get("", response_model=List[ApiKeyResponse], status_code=status.HTTP_200_OK)
async def list_api_keys(
    db: AsyncSession = Depends(get_db),
    claims: dict = requires_permission("apikey:read"),
):
    """
    Lists all API credentials for the authenticated organization.
    """
    org_id_str = claims.get("org_id")
    if not org_id_str:
        raise AppException(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="BAD_REQUEST",
            message="No organization bound to this session."
        )
    org_id = uuid.UUID(org_id_str)

    repo = ApiKeyRepository(db)
    keys = await repo.get_all_for_org(org_id)
    return keys


@router.post("", response_model=ApiKeyCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    payload: ApiKeyCreate,
    db: AsyncSession = Depends(get_db),
    claims: dict = requires_permission("apikey:write"),
):
    """
    Generates a new secure API key (`fl_live_<32_hex>`).
    Returns the raw unhashed secret key only once.
    """
    org_id_str = claims.get("org_id")
    if not org_id_str:
        raise AppException(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="BAD_REQUEST",
            message="No organization bound to this session."
        )
    org_id = uuid.UUID(org_id_str)

    repo = ApiKeyRepository(db)
    existing_keys = await repo.get_all_for_org(org_id)
    active_keys = [k for k in existing_keys if k.is_active]
    if len(active_keys) >= settings.MAX_API_KEYS_PER_USER:
        raise AppException(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="MAX_API_KEYS_EXCEEDED",
            message=f"Maximum active API keys limit reached ({settings.MAX_API_KEYS_PER_USER} active key for Developer tier). Please revoke an existing API credential before generating a new one."
        )

    raw_key = f"fl_live_{secrets.token_hex(16)}"
    key_prefix = raw_key[:16]
    key_hash = hash_token(raw_key)

    api_key = ApiKey(
        organization_id=org_id,
        key_prefix=key_prefix,
        key_hash=key_hash,
        name=payload.name,
        is_active=True,
    )

    db.add(api_key)
    await db.commit()
    await db.refresh(api_key)

    base_resp = ApiKeyResponse.model_validate(api_key)
    return ApiKeyCreateResponse(**base_resp.model_dump(), secret_key=raw_key)



@router.patch("/{key_id}/rename", response_model=ApiKeyResponse, status_code=status.HTTP_200_OK)
async def rename_api_key(
    key_id: uuid.UUID,
    payload: ApiKeyRename,
    db: AsyncSession = Depends(get_db),
    claims: dict = requires_permission("apikey:write"),
):
    """
    Renames an API key.
    """
    org_id_str = claims.get("org_id")
    if not org_id_str:
        raise AppException(status_code=status.HTTP_400_BAD_REQUEST, code="BAD_REQUEST", message="No organization bound to session.")
    org_id = uuid.UUID(org_id_str)

    repo = ApiKeyRepository(db)
    api_key = await repo.get_by_id(key_id, org_id)
    if not api_key:
        raise AppException(status_code=status.HTTP_404_NOT_FOUND, code="NOT_FOUND", message="API key not found.")

    api_key.name = payload.name
    await db.commit()
    await db.refresh(api_key)
    return api_key


@router.patch("/{key_id}/status", response_model=ApiKeyResponse, status_code=status.HTTP_200_OK)
async def toggle_api_key_status(
    key_id: uuid.UUID,
    payload: ApiKeyStatusToggle,
    db: AsyncSession = Depends(get_db),
    claims: dict = requires_permission("apikey:write"),
):
    """
    Deactivates or reactivates an API key. Invalidates Redis validation cache on change.
    """
    org_id_str = claims.get("org_id")
    if not org_id_str:
        raise AppException(status_code=status.HTTP_400_BAD_REQUEST, code="BAD_REQUEST", message="No organization bound to session.")
    org_id = uuid.UUID(org_id_str)

    repo = ApiKeyRepository(db)
    api_key = await repo.get_by_id(key_id, org_id)
    if not api_key:
        raise AppException(status_code=status.HTTP_404_NOT_FOUND, code="NOT_FOUND", message="API key not found.")

    api_key.is_active = payload.is_active
    await db.commit()
    await db.refresh(api_key)

    # Invalidate Redis cache
    await redis_manager.delete(f"apikey:validation:{api_key.key_hash}")
    return api_key


@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_api_key(
    key_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    claims: dict = requires_permission("apikey:write"),
):
    """
    Revokes and permanently deletes an API key.
    """
    org_id_str = claims.get("org_id")
    if not org_id_str:
        raise AppException(status_code=status.HTTP_400_BAD_REQUEST, code="BAD_REQUEST", message="No organization bound to session.")
    org_id = uuid.UUID(org_id_str)

    repo = ApiKeyRepository(db)
    api_key = await repo.get_by_id(key_id, org_id)
    if not api_key:
        raise AppException(status_code=status.HTTP_404_NOT_FOUND, code="NOT_FOUND", message="API key not found.")

    # Invalidate Redis cache
    await redis_manager.delete(f"apikey:validation:{api_key.key_hash}")

    await db.delete(api_key)
    await db.commit()
    return None
