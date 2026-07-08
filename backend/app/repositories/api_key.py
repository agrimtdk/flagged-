from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.repositories.base import BaseRepository
from app.models.api_key import ApiKey
from typing import Optional


class ApiKeyRepository(BaseRepository[ApiKey]):
    def __init__(self, db: AsyncSession):
        super().__init__(ApiKey, db)

    async def get_by_hash(self, key_hash: str) -> Optional[ApiKey]:
        """
        Locates ApiKey row matching SHA-256 hash parameter.
        """
        result = await self.db.execute(
            select(ApiKey).filter(ApiKey.key_hash == key_hash)
        )
        return result.scalars().first()

    async def get_all_for_org(self, organization_id) -> list[ApiKey]:
        """
        Locates all ApiKey rows for an organization ordered by creation date descending.
        """
        result = await self.db.execute(
            select(ApiKey)
            .filter(ApiKey.organization_id == organization_id)
            .order_by(ApiKey.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_id(self, key_id, organization_id) -> Optional[ApiKey]:
        """
        Locates a specific ApiKey row by ID and organization ID.
        """
        result = await self.db.execute(
            select(ApiKey).filter(
                ApiKey.id == key_id,
                ApiKey.organization_id == organization_id
            )
        )
        return result.scalars().first()

