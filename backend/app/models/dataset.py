import uuid
from typing import List, Optional
from sqlalchemy import String, Integer, Float, ForeignKey, BigInteger
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, UUIDPrimaryKeyMixin, TimestampMixin, VersionedMixin


class Dataset(Base, UUIDPrimaryKeyMixin, TimestampMixin, VersionedMixin):
    __tablename__ = "datasets"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    source: Mapped[str] = mapped_column(String(20), nullable=False)  # "CSV" | "API"
    original_filename: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_by: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size_bytes: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    total_rows: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    fraud_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    avg_risk_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    model_version: Mapped[str] = mapped_column(String(50), nullable=False, default="v1.0.0")
    threshold_version: Mapped[str] = mapped_column(String(50), nullable=False, default="v1.0.0")
    feature_schema_version: Mapped[str] = mapped_column(String(50), nullable=False, default="v1.0.0")
    processing_duration_ms: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="Completed")  # Uploading, Processing, Completed, Failed, Archived

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="datasets")
    transactions: Mapped[List["Transaction"]] = relationship(
        "Transaction",
        back_populates="dataset",
        cascade="all, delete-orphan"
    )
