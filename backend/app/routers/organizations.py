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


class OrganizationResponse(BaseModel):
    id: str
    name: str


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
        "name": org.name
    }
