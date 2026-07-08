import uuid
from datetime import datetime
from typing import Any, Dict, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field, field_validator

T = TypeVar("T")


# --- Standard Paginated Response ---
class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    page: int
    page_size: int
    total_items: int
    total_pages: int


# --- Prediction ---
class PredictRequest(BaseModel):
    transaction_external_id: str = Field(..., min_length=1, max_length=255)
    amount: float = Field(..., gt=0.0)
    card_brand: str = Field(..., min_length=1, max_length=50)
    billing_country: str = Field(..., min_length=3, max_length=3)
    ip_address: str = Field(..., min_length=1, max_length=45)
    device_type: str = Field(..., min_length=1, max_length=50)
    email_domain: str = Field(..., min_length=1, max_length=255)
    card_country: str = Field(..., min_length=3, max_length=3)
    session_name: Optional[str] = Field(None, description="Optional custom name for grouping API predictions into a collection")
    dataset_name: Optional[str] = Field(None, description="Alias for session_name")

    @field_validator("card_brand")
    @classmethod
    def validate_card_brand(cls, v: str) -> str:
        brand = v.upper().strip()
        allowed = {"VISA", "MASTERCARD", "AMEX", "DISCOVER", "OTHER"}
        if brand not in allowed:
            raise ValueError(f"card_brand must be one of {allowed}")
        return brand

    @field_validator("device_type")
    @classmethod
    def validate_device_type(cls, v: str) -> str:
        dev = v.lower().strip()
        allowed = {"desktop", "mobile", "tablet", "other"}
        if dev not in allowed:
            raise ValueError(f"device_type must be one of {allowed}")
        return dev

    @field_validator("billing_country", "card_country")
    @classmethod
    def validate_country(cls, v: str) -> str:
        return v.upper().strip()


class FeatureReason(BaseModel):
    feature: str
    impact: float


class PredictionDetails(BaseModel):
    reasons: List[FeatureReason]


class PredictResponse(BaseModel):
    prediction_id: uuid.UUID
    transaction_id: uuid.UUID
    transaction_external_id: str
    risk_score: float
    is_fraud: bool
    confidence_score: float = 0.0
    confidence_level: str = "High"
    confidence_explanation: Optional[str] = None
    dataset_id: Optional[uuid.UUID] = None
    prediction_details: PredictionDetails
    model_version: str
    prediction_latency_ms: Optional[float] = None


# --- CSV Upload ---
class CSVRowError(BaseModel):
    row_number: int
    field: str
    error: str


class CSVUploadResponse(BaseModel):
    batch_id: uuid.UUID
    total_rows: int
    processed_rows: int
    failed_rows: int
    fraud_detected: int
    validation_errors: List[CSVRowError]


# --- Transaction History ---
class TransactionResponse(BaseModel):
    id: uuid.UUID
    prediction_id: uuid.UUID
    dataset_id: Optional[uuid.UUID] = None
    transaction_external_id: str
    amount: float
    card_brand: str
    billing_country: str
    ip_address: str
    device_type: str
    email_domain: str
    card_country: str
    risk_score: float
    is_fraud: bool
    confidence_score: float = 0.0
    confidence_level: str = "High"
    prediction_details: Dict[str, Any]
    model_version: str
    threshold_used: float
    threshold_version: str = "v1.0.0"
    feature_schema_version: str = "v1.0.0"
    source: str
    created_at: datetime


class TransactionFilters(BaseModel):
    dataset_id: Optional[uuid.UUID] = None
    source: Optional[str] = None  # "API" | "CSV"
    is_fraud: Optional[bool] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    risk_score_min: Optional[float] = None
    risk_score_max: Optional[float] = None
    search: Optional[str] = None  # external transaction ID search
    sort_by: str = "created_at"  # "created_at" | "risk_score" | "amount"
    sort_order: str = "desc"  # "asc" | "desc"


# --- Analytics ---
class TopCountryItem(BaseModel):
    country: str
    count: int
    fraud_count: int


class TopBrandItem(BaseModel):
    brand: str
    count: int
    fraud_count: int


class DeviceDistributionItem(BaseModel):
    device_type: str
    count: int


class FraudByDeviceItem(BaseModel):
    device_type: str
    fraud_count: int
    total: int


class FraudByCountryItem(BaseModel):
    country: str
    fraud_count: int
    total: int


class AnalyticsSummary(BaseModel):
    total_transactions: int
    total_fraud: int
    fraud_rate: float
    avg_risk_score: float
    transactions_today: int
    transactions_this_week: int
    top_billing_countries: List[TopCountryItem]
    top_card_brands: List[TopBrandItem]
    device_distribution: List[DeviceDistributionItem]
    fraud_by_device: List[FraudByDeviceItem]
    fraud_by_country: List[FraudByCountryItem]
    source_distribution: Dict[str, int]  # e.g., {"API": count, "CSV": count}


class TimelinePoint(BaseModel):
    date: str
    total: int
    fraud: int
    avg_risk: float
