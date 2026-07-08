from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.repositories.base import BaseRepository
from app.models.user import User
from typing import Optional


class UserRepository(BaseRepository[User]):
    def __init__(self, db: AsyncSession):
        super().__init__(User, db)

    async def get_by_email(self, email: str) -> Optional[User]:
        """
        Retrieves user profiles via email lookup.
        """
        result = await self.db.execute(
            select(User).filter(User.email == email)
        )
        return result.scalars().first()
