from sqlalchemy.ext.asyncio import AsyncSession
from app.models.organization import Organization
from app.repositories.organization import OrganizationRepository


class OrganizationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.org_repo = OrganizationRepository(db)

    async def create_organization(self, name: str) -> Organization:
        """
        Creates a new tenant organization.
        """
        org = Organization(name=name)
        self.org_repo.create(org)
        await self.db.flush()
        return org

    async def get_organization(self, id: str) -> Organization:
        return await self.org_repo.get(id)
