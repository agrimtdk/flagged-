import uuid
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rbac import requires_permission
from app.services.analytics_service import AnalyticsService
from app.exceptions import AppException
from app.schemas.predict import AnalyticsSummary, TimelinePoint

logger = logging.getLogger("app.routers.analytics")
router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/summary", response_model=AnalyticsSummary, status_code=status.HTTP_200_OK)
async def get_analytics_summary(
    dataset_id: Optional[uuid.UUID] = Query(None, description="Filter by collection/dataset ID"),
    db: AsyncSession = Depends(get_db),
    claims: dict = requires_permission("analytics:read"),
):
    """
    Retrieves full dashboard analytics summary (11 distinct segmentation metrics).
    Utilizes Redis cache invalidation on new model predictions.
    """
    org_id_str = claims.get("org_id")
    if not org_id_str:
        raise AppException(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="BAD_REQUEST",
            message="No organization bound to this session."
        )
    org_id = uuid.UUID(org_id_str)

    analytics_service = AnalyticsService(db)

    try:
        summary = await analytics_service.get_summary(org_id, dataset_id=dataset_id)
        return summary
    except Exception as e:
        logger.error(f"Failed to fetch analytics summary: {e}")
        if isinstance(e, AppException):
            raise e
        raise AppException(
            status_code=500,
            code="ANALYTICS_FAILED",
            message=f"Retrieval of analytics summary failed: {e}"
        )


@router.get("/timeline", response_model=List[TimelinePoint], status_code=status.HTTP_200_OK)
async def get_analytics_timeline(
    days: int = Query(30, ge=1, le=90, description="Timeline span in days"),
    dataset_id: Optional[uuid.UUID] = Query(None, description="Filter by collection/dataset ID"),
    db: AsyncSession = Depends(get_db),
    claims: dict = requires_permission("analytics:read"),
):
    """
    Retrieves chronological daily totals and fraud trend metrics.
    """
    org_id_str = claims.get("org_id")
    if not org_id_str:
        raise AppException(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="BAD_REQUEST",
            message="No organization bound to this session."
        )
    org_id = uuid.UUID(org_id_str)

    analytics_service = AnalyticsService(db)

    try:
        timeline = await analytics_service.get_timeline(org_id, days=days, dataset_id=dataset_id)
        return timeline
    except Exception as e:
        logger.error(f"Failed to fetch analytics timeline: {e}")
        if isinstance(e, AppException):
            raise e
        raise AppException(
            status_code=500,
            code="ANALYTICS_FAILED",
            message=f"Retrieval of analytics timeline failed: {e}"
        )


@router.get("/model-informatics", status_code=status.HTTP_200_OK)
async def get_model_informatics(
    db: AsyncSession = Depends(get_db),
    claims: dict = requires_permission("analytics:read"),
):
    """
    Retrieves dynamic, end-to-end model informatics spanning Section 1 to 12.
    Serves model metadata, performance metrics, governance, and explainability.
    """
    analytics_service = AnalyticsService(db)
    try:
        data = await analytics_service.get_model_informatics()
        return data
    except Exception as e:
        logger.error(f"Failed to fetch model informatics: {e}")
        if isinstance(e, AppException):
            raise e
        raise AppException(
            status_code=500,
            code="INFORMATICS_FAILED",
            message=f"Retrieval of model informatics failed: {e}"
        )

