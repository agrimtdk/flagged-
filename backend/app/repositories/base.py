from typing import Generic, TypeVar, Type, Optional, List, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType], db: AsyncSession):
        self.model = model
        self.db = db

    async def get(self, id: Any) -> Optional[ModelType]:
        """
        Retrieves record by primary key UUID.
        """
        result = await self.db.execute(
            select(self.model).filter(self.model.id == id)
        )
        return result.scalars().first()

    async def get_all(self, offset: int = 0, limit: int = 100) -> List[ModelType]:
        """
        Retrieves records list with offset/limit bounds.
        """
        result = await self.db.execute(
            select(self.model).offset(offset).limit(limit)
        )
        return list(result.scalars().all())

    def create(self, obj: ModelType) -> ModelType:
        """
        Registers creation change in session. Transaction commits belong to the service layer.
        """
        self.db.add(obj)
        return obj

    async def delete(self, id: Any) -> bool:
        """
        Registers deletion change in session.
        """
        obj = await self.get(id)
        if obj:
            await self.db.delete(obj)
            return True
        return False

    def update(self, obj: ModelType) -> ModelType:
        """
        Updates session object.
        """
        self.db.add(obj)
        return obj

    async def flush(self) -> None:
        """
        Executes query changes to verify constraints without closing the transaction block.
        """
        await self.db.flush()
