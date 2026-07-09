import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.dataset import Dataset
from app.models.transaction import Transaction
from app.repositories.dataset import DatasetRepository
from app.core.redis import redis_manager
from app.exceptions import AppException
from fastapi import status


class DatasetService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = DatasetRepository(db)

    async def create_collection(
        self,
        org_id: uuid.UUID,
        name: str,
        source: str,
        created_by: str,
        original_filename: Optional[str] = None,
        file_size_bytes: Optional[int] = None,
        total_rows: int = 0,
        fraud_count: int = 0,
        avg_risk_score: float = 0.0,
        model_version: str = "v1.1.0",
        threshold_version: str = "v1.0.0",
        feature_schema_version: str = "v1.0.0",
        processing_duration_ms: Optional[float] = None,
        status_str: str = "Completed",
        dataset_id: Optional[uuid.UUID] = None,
    ) -> Dataset:
        """
        Creates a new data collection (Dataset) with full metadata and lifecycle state.
        """
        dataset = Dataset(
            id=dataset_id or uuid.uuid4(),
            organization_id=org_id,
            name=name,
            source=source,
            original_filename=original_filename,
            created_by=created_by,
            file_size_bytes=file_size_bytes,
            total_rows=total_rows,
            fraud_count=fraud_count,
            avg_risk_score=avg_risk_score,
            model_version=model_version,
            threshold_version=threshold_version,
            feature_schema_version=feature_schema_version,
            processing_duration_ms=processing_duration_ms,
            status=status_str,
        )
        self.repo.create(dataset)
        await self.repo.flush()
        return dataset

    async def get_or_create_api_session(
        self,
        org_id: uuid.UUID,
        session_name: Optional[str] = None,
        created_by: str = "API Client",
        model_version: str = "v1.1.0",
        threshold_version: str = "v1.0.0",
        feature_schema_version: str = "v1.0.0",
    ) -> Dataset:
        """
        Retrieves or creates an API session Dataset for grouping prediction calls.
        If session_name is omitted, defaults to today's API Session (e.g. 'API Session - YYYY-MM-DD').
        """
        if not session_name or not session_name.strip():
            today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            session_name = f"API Session - {today_str}"
        else:
            session_name = session_name.strip()

        existing = await self.repo.get_by_name_and_source(org_id, session_name, "API")
        if existing:
            return existing

        return await self.create_collection(
            org_id=org_id,
            name=session_name,
            source="API",
            created_by=created_by,
            model_version=model_version,
            threshold_version=threshold_version,
            feature_schema_version=feature_schema_version,
            status_str="Completed",
        )

    async def increment_stats(
        self,
        dataset: Dataset,
        rows_added: int = 1,
        fraud_added: int = 0,
        risk_sum_added: float = 0.0,
    ) -> None:
        """
        Increments statistics for an existing dataset (e.g. after real-time API scoring).
        """
        old_rows = dataset.total_rows
        old_sum = dataset.avg_risk_score * old_rows
        new_rows = old_rows + rows_added
        new_sum = old_sum + risk_sum_added

        dataset.total_rows = new_rows
        dataset.fraud_count = dataset.fraud_count + fraud_added
        dataset.avg_risk_score = round(new_sum / new_rows, 4) if new_rows > 0 else 0.0
        self.repo.update(dataset)
        await self.repo.flush()

    async def get_collection(self, dataset_id: uuid.UUID, org_id: uuid.UUID) -> Dataset:
        dataset = await self.repo.get_by_id(dataset_id, org_id)
        if not dataset:
            raise AppException(
                status_code=status.HTTP_404_NOT_FOUND,
                code="COLLECTION_NOT_FOUND",
                message="Data collection not found or access denied."
            )
        return dataset

    async def list_collections(
        self,
        org_id: uuid.UUID,
        source: Optional[str] = None,
        status_str: Optional[str] = None,
        limit: int = 100
    ) -> List[Dataset]:
        return await self.repo.list_by_org(org_id, source=source, status=status_str, limit=limit)

    async def delete_collection(self, dataset_id: uuid.UUID, org_id: uuid.UUID) -> bool:
        dataset = await self.get_collection(dataset_id, org_id)

        # 1. Delete all transactions belonging to this dataset / batch
        await self.db.execute(
            delete(Transaction).where(
                Transaction.organization_id == org_id,
                (Transaction.dataset_id == dataset.id) | (Transaction.batch_id == dataset.id)
            )
        )

        # 2. Delete the dataset itself
        await self.repo.delete(dataset.id)
        await self.db.commit()

        # 3. Invalidate Redis analytics cache for this tenant so stats update immediately
        if redis_manager.client:
            try:
                pattern = f"analytics:{org_id}:*"
                keys = await redis_manager.client.keys(pattern)
                if keys:
                    await redis_manager.client.delete(*keys)
            except Exception:
                pass

        return True
