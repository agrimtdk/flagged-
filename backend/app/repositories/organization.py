from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.repositories.base import BaseRepository
from app.models.organization import Organization
from typing import Optional


class OrganizationRepository(BaseRepository[Organization]):
    def __init__(self, db: AsyncSession):
        super().__init__(Organization, db)

    async def get_by_name(self, name: str) -> Optional[Organization]:
        result = await self.db.execute(
            select(Organization).filter(Organization.name == name)
        )
        return result.scalars().first()
