import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.repositories.user import UserRepository
from typing import Optional


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)

    async def get_user_by_email(self, email: str) -> Optional[User]:
        return await self.user_repo.get_by_email(email)

    async def create_user(
        self,
        organization_id: uuid.UUID,
        email: str,
        full_name: str,
        role: str = "Analyst",
        avatar_url: Optional[str] = None
    ) -> User:
        """
        Creates a new user profile under a tenant organization.
        """
        user = User(
            organization_id=organization_id,
            email=email,
            full_name=full_name,
            role=role,
            avatar_url=avatar_url,
            is_active=True
        )
        self.user_repo.create(user)
        await self.db.flush()
        return user

    async def get_user(self, user_id: uuid.UUID) -> Optional[User]:
        return await self.user_repo.get(user_id)
