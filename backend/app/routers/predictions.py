import math
import uuid
import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, File, UploadFile, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.config import settings
from app.core.ml_engine import MLEngine, get_ml_engine
from app.core.rbac import requires_permission, requires_prediction_permission
from app.repositories.transaction import TransactionRepository
from app.services.prediction_service import PredictionService
from app.services.csv_service import CSVService
from app.exceptions import AppException
from app.schemas.predict import (
    PredictRequest,
    PredictResponse,
    CSVUploadResponse,
    TransactionResponse,
    TransactionFilters,
    PaginatedResponse,
)

logger = logging.getLogger("app.routers.predictions")
router = APIRouter(tags=["Predictions & Transactions"])


@router.post("/predict", response_model=PredictResponse, status_code=status.HTTP_200_OK)
async def predict_transaction(
    payload: PredictRequest,
    db: AsyncSession = Depends(get_db),
    ml_engine: MLEngine = Depends(get_ml_engine),
    claims: dict = requires_prediction_permission(),
):
    """
    Real-time fraud prediction endpoint.
    Accepts both standard user JWTs and merchant API Keys.
    Scores the transaction, logs compliance metadata, and invalidates analytics caches.
    """
    org_id_str = claims.get("org_id")
    if not org_id_str:
        raise AppException(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="BAD_REQUEST",
            message="No organization bound to this session."
        )
    org_id = uuid.UUID(org_id_str)

    prediction_service = PredictionService(db, ml_engine)
    source = "API" if claims.get("sub") == "api_key" else "Web"
    created_by = claims.get("email") or claims.get("sub") or "API Client"

    try:
        response = await prediction_service.predict_single(org_id, payload, source=source, created_by=created_by)
        if source == "API" and claims.get("key_hash"):
            from app.repositories.api_key import ApiKeyRepository
            from datetime import datetime, timezone
            repo = ApiKeyRepository(db)
            key = await repo.get_by_hash(claims["key_hash"])
            if key:
                key.last_used_at = datetime.now(timezone.utc)
        await db.commit()

        # Conditionally omit prediction latency in response if debug info is disabled
        if not settings.SHOW_DEBUG_INFO:
            response.prediction_latency_ms = None

        return response
    except Exception as e:
        await db.rollback()
        logger.error(f"Prediction transaction handler failed: {e}")
        if isinstance(e, AppException):
            raise e
        raise AppException(
            status_code=500,
            code="PREDICTION_FAILED",
            message=f"Prediction scoring failed: {e}"
        )


@router.post("/transactions/upload", response_model=CSVUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_csv_transactions(
    file: UploadFile = File(..., description="CSV file of transactions (max 50,000 rows)"),
    db: AsyncSession = Depends(get_db),
    ml_engine: MLEngine = Depends(get_ml_engine),
    claims: dict = requires_permission("csv:upload"),
):
    """
    Batch transaction scoring via CSV upload.
    Requires 'csv:upload' permission (JWT only).
    Streams CSV rows, performs validation, batch scoring, and bulk db inserts.
    """
    org_id_str = claims.get("org_id")
    if not org_id_str:
        raise AppException(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="BAD_REQUEST",
            message="No organization bound to this session."
        )
    org_id = uuid.UUID(org_id_str)
    created_by = claims.get("email") or claims.get("sub") or "CSV Upload"

    csv_service = CSVService(db, ml_engine)

    try:
        response = await csv_service.process_upload(org_id, file, created_by=created_by)
        await db.commit()
        return response
    except Exception as e:
        await db.rollback()
        logger.error(f"CSV transaction upload failed: {e}")
        if isinstance(e, AppException):
            raise e
        raise AppException(
            status_code=500,
            code="CSV_UPLOAD_FAILED",
            message=f"CSV upload processing failed: {e}"
        )


@router.get("/transactions", response_model=PaginatedResponse[TransactionResponse])
async def list_transactions(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(25, ge=1, le=100, description="Page size"),
    dataset_id: Optional[uuid.UUID] = Query(None, description="Filter by collection/dataset ID"),
    source: Optional[str] = Query(None, description="Filter by source (API or CSV)"),
    is_fraud: Optional[bool] = Query(None, description="Filter by fraud decision"),
    date_from: Optional[datetime] = Query(None, description="Filter starting created date"),
    date_to: Optional[datetime] = Query(None, description="Filter ending created date"),
    risk_score_min: Optional[float] = Query(None, ge=0.0, le=1.0, description="Filter min risk score"),
    risk_score_max: Optional[float] = Query(None, ge=0.0, le=1.0, description="Filter max risk score"),
    search: Optional[str] = Query(None, description="Filter search matches on external transaction ID"),
    sort_by: str = Query("created_at", description="Sort by field name"),
    sort_order: str = Query("desc", description="Sort order (asc or desc)"),
    db: AsyncSession = Depends(get_db),
    claims: dict = requires_permission("analytics:read"),
):
    """
    Lists paginated transactions history for the organization.
    Supports comprehensive sorting and filtering parameters.
    """
    org_id_str = claims.get("org_id")
    if not org_id_str:
        raise AppException(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="BAD_REQUEST",
            message="No organization bound to this session."
        )

    filters = TransactionFilters(
        dataset_id=dataset_id,
        source=source,
        is_fraud=is_fraud,
        date_from=date_from,
        date_to=date_to,
        risk_score_min=risk_score_min,
        risk_score_max=risk_score_max,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
    )

    repo = TransactionRepository(db)
    items, total_items = await repo.get_paginated(page, page_size, filters, org_id=uuid.UUID(org_id_str))
    total_pages = math.ceil(total_items / page_size) if page_size > 0 else 0

    response_items = []
    for tx in items:
        response_items.append(
            TransactionResponse(
                id=tx.id,
                prediction_id=tx.prediction_id,
                dataset_id=tx.dataset_id,
                transaction_external_id=tx.transaction_external_id,
                amount=float(tx.amount),
                card_brand=tx.card_brand,
                billing_country=tx.billing_country,
                ip_address=tx.ip_address,
                device_type=tx.device_type,
                email_domain=tx.email_domain,
                card_country=tx.card_country,
                risk_score=tx.risk_score,
                is_fraud=tx.is_fraud,
                confidence_score=getattr(tx, "confidence_score", None) or 0.0,
                confidence_level=getattr(tx, "confidence_level", None) or "High",
                prediction_details=tx.prediction_details,
                model_version=tx.model_version,
                threshold_used=tx.threshold_used,
                threshold_version=getattr(tx, "threshold_version", None) or "v1.0.0",
                feature_schema_version=getattr(tx, "feature_schema_version", None) or "v1.0.0",
                source=tx.source,
                created_at=tx.created_at,
            )
        )

    return PaginatedResponse(
        items=response_items,
        page=page,
        page_size=page_size,
        total_items=total_items,
        total_pages=total_pages,
    )


@router.get("/transactions/{prediction_id}", response_model=TransactionResponse)
async def get_transaction_details(
    prediction_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    claims: dict = requires_permission("analytics:read"),
):
    """
    Retrieves full transaction details by prediction_id.
    """
    org_id_str = claims.get("org_id")
    if not org_id_str:
        raise AppException(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="BAD_REQUEST",
            message="No organization bound to this session."
        )

    repo = TransactionRepository(db)
    tx = await repo.get_by_prediction_id(prediction_id, org_id=uuid.UUID(org_id_str))
    if not tx:
        raise AppException(
            status_code=status.HTTP_404_NOT_FOUND,
            code="TRANSACTION_NOT_FOUND",
            message="Transaction not found with this prediction ID."
        )

    return TransactionResponse(
        id=tx.id,
        prediction_id=tx.prediction_id,
        dataset_id=tx.dataset_id,
        transaction_external_id=tx.transaction_external_id,
        amount=float(tx.amount),
        card_brand=tx.card_brand,
        billing_country=tx.billing_country,
        ip_address=tx.ip_address,
        device_type=tx.device_type,
        email_domain=tx.email_domain,
        card_country=tx.card_country,
        risk_score=tx.risk_score,
        is_fraud=tx.is_fraud,
        confidence_score=getattr(tx, "confidence_score", None) or 0.0,
        confidence_level=getattr(tx, "confidence_level", None) or "High",
        prediction_details=tx.prediction_details,
        model_version=tx.model_version,
        threshold_used=tx.threshold_used,
        threshold_version=getattr(tx, "threshold_version", None) or "v1.0.0",
        feature_schema_version=getattr(tx, "feature_schema_version", None) or "v1.0.0",
        source=tx.source,
        created_at=tx.created_at,
    )
