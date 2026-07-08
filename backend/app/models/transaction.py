import uuid
from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, String, Numeric, Float, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, UUIDPrimaryKeyMixin, TimestampMixin, VersionedMixin
from typing import Optional, Dict, Any


class Transaction(Base, UUIDPrimaryKeyMixin, TimestampMixin, VersionedMixin):
    __tablename__ = "transactions"

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    prediction_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        unique=True,
        index=True,
        nullable=False
    )
    transaction_external_id: Mapped[str] = mapped_column(String(255), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    card_brand: Mapped[str] = mapped_column(String(50), nullable=False)
    billing_country: Mapped[str] = mapped_column(String(3), nullable=False)
    ip_address: Mapped[str] = mapped_column(String(45), nullable=False)
    device_type: Mapped[str] = mapped_column(String(50), nullable=False)
    email_domain: Mapped[str] = mapped_column(String(255), nullable=False)
    card_country: Mapped[str] = mapped_column(String(3), nullable=False)
    risk_score: Mapped[float] = mapped_column(Float, nullable=False)
    is_fraud: Mapped[bool] = mapped_column(Boolean, nullable=False)
    prediction_details: Mapped[Dict[str, Any]] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"),
        nullable=False
    )

    model_version: Mapped[str] = mapped_column(String(20), nullable=False)
    threshold_version: Mapped[str] = mapped_column(String(50), nullable=False, default="v1.0.0")
    feature_schema_version: Mapped[str] = mapped_column(String(50), nullable=False, default="v1.0.0")
    threshold_used: Mapped[float] = mapped_column(Float, nullable=False)
    prediction_latency_ms: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    confidence_level: Mapped[str] = mapped_column(String(20), nullable=False, default="High")
    source: Mapped[str] = mapped_column(String(20), nullable=False)  # "API" | "CSV"
    batch_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
        index=True
    )
    dataset_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("datasets.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="transactions")
    dataset: Mapped[Optional["Dataset"]] = relationship("Dataset", back_populates="transactions")
