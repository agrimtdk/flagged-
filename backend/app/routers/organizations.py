import logging
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.rbac import requires_permission
from app.services.organization_service import OrganizationService
from app.exceptions import AppException

logger = logging.getLogger("app.routers.organizations")
router = APIRouter(prefix="/organizations", tags=["Organizations"])


from typing import Optional

class OrganizationResponse(BaseModel):
    id: str
    name: str
    risk_threshold: float = 0.50


class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    risk_threshold: Optional[float] = None


class ThresholdUpdate(BaseModel):
    risk_threshold: float


@router.get("/current", response_model=OrganizationResponse)
async def get_current_organization(
    claims: dict = requires_permission("analytics:read"),
    db: AsyncSession = Depends(get_db)
):
    org_id = claims.get("org_id")
    if not org_id:
        raise AppException(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="BAD_REQUEST",
            message="No organization is bound to your authentication session."
        )

    org_service = OrganizationService(db)
    org = await org_service.get_organization(org_id)
    if not org:
        raise AppException(
            status_code=status.HTTP_404_NOT_FOUND,
            code="ORGANIZATION_NOT_FOUND",
            message="Organization not located."
        )
        
    return {
        "id": str(org.id),
        "name": org.name,
        "risk_threshold": getattr(org, "risk_threshold", 0.50) or 0.50
    }


@router.patch("/current", response_model=OrganizationResponse)
async def update_current_organization(
    payload: OrganizationUpdate,
    claims: dict = requires_permission("apikey:write"),
    db: AsyncSession = Depends(get_db)
):
    org_id = claims.get("org_id")
    if not org_id:
        raise AppException(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="BAD_REQUEST",
            message="No organization is bound to your authentication session."
        )

    if payload.risk_threshold is not None and not (0.0 <= payload.risk_threshold <= 1.0):
        raise AppException(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="INVALID_THRESHOLD",
            message="Risk threshold must be between 0.00 and 1.00."
        )

    org_service = OrganizationService(db)
    name_val = payload.name.strip() if payload.name else None
    org = await org_service.update_organization(org_id, name=name_val, risk_threshold=payload.risk_threshold)
    if not org:
        raise AppException(
            status_code=status.HTTP_404_NOT_FOUND,
            code="ORGANIZATION_NOT_FOUND",
            message="Organization not located."
        )

    await db.commit()
    return {
        "id": str(org.id),
        "name": org.name,
        "risk_threshold": getattr(org, "risk_threshold", 0.50) or 0.50
    }


@router.get("/current/threshold")
async def get_current_threshold(
    claims: dict = requires_permission("analytics:read"),
    db: AsyncSession = Depends(get_db)
):
    org_id = claims.get("org_id")
    if not org_id:
        raise AppException(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="BAD_REQUEST",
            message="No organization is bound to your authentication session."
        )

    org_service = OrganizationService(db)
    org = await org_service.get_organization(org_id)
    threshold = getattr(org, "risk_threshold", 0.50) if org else 0.50
    return {"risk_threshold": threshold or 0.50}


@router.patch("/current/threshold")
async def update_current_threshold(
    payload: ThresholdUpdate,
    claims: dict = requires_permission("apikey:write"),
    db: AsyncSession = Depends(get_db)
):
    org_id = claims.get("org_id")
    if not org_id:
        raise AppException(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="BAD_REQUEST",
            message="No organization is bound to your authentication session."
        )

    if not (0.0 <= payload.risk_threshold <= 1.0):
        raise AppException(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="INVALID_THRESHOLD",
            message="Risk threshold must be between 0.00 and 1.00."
        )

    org_service = OrganizationService(db)
    org = await org_service.update_organization(org_id, risk_threshold=payload.risk_threshold)
    if not org:
        raise AppException(
            status_code=status.HTTP_404_NOT_FOUND,
            code="ORGANIZATION_NOT_FOUND",
            message="Organization not located."
        )

    await db.commit()
    return {"status": "success", "risk_threshold": getattr(org, "risk_threshold", 0.50)}


@router.delete("/current/audit-logs", status_code=status.HTTP_200_OK)
async def prune_audit_logs(
    claims: dict = requires_permission("apikey:write"),
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy import text
    org_id = claims.get("org_id")
    if not org_id:
        raise AppException(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="BAD_REQUEST",
            message="No organization is bound to your authentication session."
        )

    # Prune all historical transactions and datasets for this organization
    tx_result = await db.execute(
        text("DELETE FROM transactions WHERE organization_id = :org_id"),
        {"org_id": org_id}
    )
    ds_result = await db.execute(
        text("DELETE FROM datasets WHERE organization_id = :org_id"),
        {"org_id": org_id}
    )
    await db.commit()
    pruned_count = (tx_result.rowcount or 0) + (ds_result.rowcount or 0)
    return {
        "status": "success",
        "pruned_count": pruned_count,
        "message": f"Historical audit logs pruned successfully ({pruned_count} records deleted)."
    }
