import uuid
from datetime import datetime, timezone
from sqlalchemy import DateTime, Integer, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """
    Common SQLAlchemy Declarative Base.
    """
    pass


class UUIDPrimaryKeyMixin:
    """
    Mixin providing UUID primary keys to tables.
    """
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )


class TimestampMixin:
    """
    Mixin providing automated creation and update timestamps (timezone-aware UTC).
    """
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )


class VersionedMixin:
    """
    Mixin providing optimistic locking version numbers.
    """
    version_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
        server_default="1"
    )

    __mapper_args__ = {
        "version_id_col": version_id
    }
