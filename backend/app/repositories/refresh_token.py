import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update
from app.repositories.base import BaseRepository
from app.models.refresh_token import RefreshToken
from typing import Optional


class RefreshTokenRepository(BaseRepository[RefreshToken]):
    def __init__(self, db: AsyncSession):
        super().__init__(RefreshToken, db)

    async def get_by_hash(self, token_hash: str) -> Optional[RefreshToken]:
        """
        Locates token row matching SHA-256 hash parameter.
        """
        result = await self.db.execute(
            select(RefreshToken).filter(RefreshToken.token_hash == token_hash)
        )
        return result.scalars().first()

    async def revoke_all_for_user(self, user_id: uuid.UUID) -> None:
        """
        Inactivates all token instances belonging to the user.
        """
        await self.db.execute(
            update(RefreshToken)
            .where(RefreshToken.user_id == user_id)
            .values(is_revoked=True)
        )
