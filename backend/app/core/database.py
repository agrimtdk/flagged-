import logging
import urllib.parse
from typing import AsyncGenerator
from sqlalchemy import text, event
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings
from app.core.context import org_id_ctx
import app.models

logger = logging.getLogger("app.core.database")

import os

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = (
        f"postgresql+asyncpg://{settings.POSTGRES_USER}:{urllib.parse.quote_plus(settings.POSTGRES_PASSWORD)}"
        f"@{settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
    )

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

DATABASE_URL = DATABASE_URL.split("?")[0]

# Initialize production-ready async database engine
engine = create_async_engine(
    DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=20,
    max_overflow=10,
    pool_recycle=3600,
    pool_pre_ping=True
)

# Async session factory
async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)


# Reusable database session dependency
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
# Automatic RLS Session Context injection via SQLAlchemy Events
@event.listens_for(Session, "after_begin")
def inject_tenant_context_on_begin(session: Session, transaction, connection):
    org_id = org_id_ctx.get()
    
    # Only register execution interceptor if tenant context is present
    if org_id:
        @event.listens_for(connection, "before_cursor_execute", once=True)
        def execute_set_local_org(conn, cursor, statement, parameters, context, executemany):
            # Enforce SET LOCAL app.current_org_id within the transaction context
            # Use string interpolation safely since org_id is validated as UUID
            cursor.execute(f"SET LOCAL app.current_org_id = '{org_id}'")
            logger.debug(f"SQL transaction configured with tenant: {org_id}")
