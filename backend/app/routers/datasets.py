import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rbac import requires_permission
from app.services.dataset_service import DatasetService
from app.schemas.dataset import DatasetResponse, DatasetListResponse
from app.exceptions import AppException

router = APIRouter(tags=["Collections & Datasets"])


@router.get("/collections", response_model=DatasetListResponse)
@router.get("/datasets", response_model=DatasetListResponse, include_in_schema=False)
async def list_collections(
    source: Optional[str] = Query(None, description="Filter by source (API or CSV)"),
    status_str: Optional[str] = Query(None, alias="status", description="Filter by lifecycle status"),
    limit: int = Query(100, ge=1, le=500, description="Max collections to return"),
    db: AsyncSession = Depends(get_db),
    claims: dict = requires_permission("analytics:read"),
):
    """
    Lists all data collections (uploaded CSV batches or API prediction sessions) for the organization.
    Enforces strict tenant data isolation by organization_id.
    """
    org_id_str = claims.get("org_id")
    if not org_id_str:
        raise AppException(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="BAD_REQUEST",
            message="No organization bound to this session."
        )

    org_id = uuid.UUID(org_id_str)
    service = DatasetService(db)
    items = await service.list_collections(org_id, source=source, status_str=status_str, limit=limit)
    
    return DatasetListResponse(items=items, total=len(items))


@router.get("/collections/{collection_id}", response_model=DatasetResponse)
@router.get("/datasets/{collection_id}", response_model=DatasetResponse, include_in_schema=False)
async def get_collection(
    collection_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    claims: dict = requires_permission("analytics:read"),
):
    """
    Retrieves rich metadata and statistical summary for a specific data collection.
    """
    org_id_str = claims.get("org_id")
    if not org_id_str:
        raise AppException(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="BAD_REQUEST",
            message="No organization bound to this session."
        )

    org_id = uuid.UUID(org_id_str)
    service = DatasetService(db)
    return await service.get_collection(collection_id, org_id)


@router.delete("/collections/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
@router.delete("/datasets/{collection_id}", status_code=status.HTTP_204_NO_CONTENT, include_in_schema=False)
async def delete_collection(
    collection_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    claims: dict = requires_permission("analytics:read"),
):
    """
    Deletes a specific data collection and its associated transactions.
    """
    org_id_str = claims.get("org_id")
    if not org_id_str:
        raise AppException(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="BAD_REQUEST",
            message="No organization bound to this session."
        )

    org_id = uuid.UUID(org_id_str)
    service = DatasetService(db)
    await service.delete_collection(collection_id, org_id)
    return None
