import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class DatasetResponse(BaseModel):
    id: uuid.UUID
    name: str
    organization_id: uuid.UUID
    source: str
    original_filename: Optional[str] = None
    created_by: str
    file_size_bytes: Optional[int] = None
    total_rows: int
    fraud_count: int
    avg_risk_score: float
    model_version: str
    threshold_version: str
    feature_schema_version: str
    processing_duration_ms: Optional[float] = None
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DatasetListResponse(BaseModel):
    items: List[DatasetResponse]
    total: int
