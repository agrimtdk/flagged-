import uuid
from typing import List, Optional
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.dataset import Dataset
from app.repositories.base import BaseRepository


class DatasetRepository(BaseRepository[Dataset]):
    def __init__(self, db: AsyncSession):
        super().__init__(Dataset, db)

    async def get_by_id(self, dataset_id: uuid.UUID, org_id: uuid.UUID) -> Optional[Dataset]:
        """
        Retrieves a Dataset by ID, explicitly scoped by organization_id for tenant isolation.
        """
        query = select(Dataset).where(
            Dataset.id == dataset_id,
            Dataset.organization_id == org_id
        )
        result = await self.db.execute(query)
        return result.scalars().first()

    async def get_by_name_and_source(self, org_id: uuid.UUID, name: str, source: str) -> Optional[Dataset]:
        """
        Retrieves a Dataset by name and source within an organization (used for API session grouping).
        """
        query = select(Dataset).where(
            Dataset.organization_id == org_id,
            Dataset.name == name,
            Dataset.source == source
        )
        result = await self.db.execute(query)
        return result.scalars().first()

    async def list_by_org(
        self,
        org_id: uuid.UUID,
        source: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100
    ) -> List[Dataset]:
        """
        Lists all Datasets for an organization, ordered by created_at descending.
        Optionally filters by source ("CSV" or "API") and status ("Completed", "Active", etc.).
        """
        query = select(Dataset).where(Dataset.organization_id == org_id)
        if source:
            query = query.where(Dataset.source == source)
        if status:
            query = query.where(Dataset.status == status)
        
        query = query.order_by(desc(Dataset.created_at)).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())
