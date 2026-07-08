import pytest
import pytest_asyncio
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings

# Import all models to register them on Base.metadata
from app.models.base import Base
from app.models.organization import Organization
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.models.api_key import ApiKey
from app.models.transaction import Transaction



# Override settings environment for testing
settings.ENV = "testing"
settings.DEBUG = False


@pytest_asyncio.fixture(scope="session")
async def test_engine():
    # For testing, we can use an in-memory SQLite async database 
    # to unit test core services and repositories without needing live Postgres containers.
    # Note: RLS logic is bypassed in SQLite, but RLS specific tests will mock Postgres connections.
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    session_factory = async_sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
    
    async with session_factory() as session:
        yield session
        await session.rollback()
