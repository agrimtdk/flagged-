# Phase 4: ML Integration, API Endpoints & Dashboard Wiring

## Goal
Integrate the Phase 3 ML artifacts into the FastAPI backend, expose real-time prediction and batch CSV upload endpoints, build an analytics engine, and wire the frontend dashboard pages to live API data.

---

## Background

Phase 3 produced a standalone ML pipeline with versioned artifacts at `ml/artifacts/v1.0.0/`:
- `model.joblib` — Trained CatBoost classifier
- `preprocessor.joblib` — Feature engineering pipeline
- `metadata.json` — Threshold (0.50), feature list, metrics

The backend already has:
- Full auth (Google OAuth + JWT + refresh rotation)
- Multi-tenancy with RLS
- API key management
- RBAC with Phase 4 permissions **already defined**: `predict:realtime`, `csv:upload`, `analytics:read`

---

## User Review Required

> [!IMPORTANT]
> **API Key Authentication for `/predict`**: The SDD specifies that the prediction endpoint accepts both JWT session tokens AND API keys (`Authorization: Bearer <API_KEY>`). The current `get_current_user_claims` dependency only handles JWT. I will add a **dual-auth dependency** that tries JWT first, then falls back to API key hash lookup (Redis-cached). This is a new auth path.

> [!IMPORTANT]
> **CSV Upload Size Limit**: The SDD specifies up to 50,000 rows. I will enforce a 10MB file size limit and 50,000 row cap with clear error messages. Processing will be synchronous (V1 scope) using FastAPI's thread pool.

> [!IMPORTANT]
> **Alembic Migration**: A new `transactions` table will be created with RLS policies matching the existing pattern. This requires running `alembic revision` and `alembic upgrade head`.

---

## Proposed Changes

### Step 1: Transaction SQLAlchemy Model + Alembic Migration

#### [NEW] [transaction.py](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/backend/app/models/transaction.py)

New SQLAlchemy model matching the SDD schema (Section 26):

```python
class Transaction(Base, UUIDPrimaryKeyMixin, TimestampMixin, VersionedMixin):
    __tablename__ = "transactions"
    
    organization_id: UUID (FK → organizations.id, CASCADE)
    transaction_external_id: str
    amount: Decimal(12,2)
    card_brand: str
    billing_country: str(3)
    ip_address: str(45)
    device_type: str(50)
    email_domain: str(255)
    card_country: str(3)
    risk_score: float
    is_fraud: bool
    prediction_details: JSONB
    source: str ("API" | "CSV")
```

Indexes: `(organization_id, created_at DESC)`, `(organization_id, is_fraud)`

#### [MODIFY] [__init__.py](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/backend/app/models/__init__.py)

Register `Transaction` model.

#### [NEW] Alembic Migration

Auto-generate migration for `transactions` table with RLS policy:
```sql
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON transactions
    USING (organization_id::text = current_setting('app.current_org_id', true));
```

---

### Step 2: ML Engine Singleton (Model Loader)

#### [NEW] [ml_engine.py](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/backend/app/core/ml_engine.py)

Singleton wrapper around `FraudPredictor` that loads model on app startup:

```python
class MLEngine:
    predictor: Optional[FraudPredictor] = None
    
    async def initialize(version: str)  # Called in app lifespan
    def predict(transaction: dict) -> dict
    def is_loaded() -> bool
```

- Loaded once in `main.py` lifespan (alongside Redis init)
- Exposed via `get_ml_engine()` dependency
- Health endpoint updated to show `ml_model: "loaded"` instead of `"placeholder_not_loaded"`

#### [MODIFY] [config.py](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/backend/app/core/config.py)

Add settings:
- `MODEL_VERSION: str = "v1.0.0"`
- `ML_ARTIFACT_DIR: str = "ml/artifacts"`
- `CSV_MAX_ROWS: int = 50000`
- `CSV_MAX_SIZE_MB: int = 10`

#### [MODIFY] [main.py](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/backend/main.py)

- Initialize `MLEngine` in lifespan startup
- Mount new routers: `predictions`, `analytics`

---

### Step 3: Pydantic Schemas

#### [NEW] [predict.py](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/backend/app/schemas/predict.py)

Request/response schemas matching SDD Section 28:

```python
class PredictRequest(BaseModel):
    transaction_external_id: str
    amount: float (>= 0.01)
    card_brand: str (VISA/MASTERCARD/AMEX/DISCOVER/OTHER)
    billing_country: str (3-char ISO)
    ip_address: str
    device_type: str (desktop/mobile/tablet/other)
    email_domain: str
    card_country: str (3-char ISO)

class PredictResponse(BaseModel):
    transaction_id: UUID
    transaction_external_id: str
    risk_score: float
    is_fraud: bool
    prediction_details: dict

class CSVUploadResponse(BaseModel):
    batch_id: UUID
    total_rows: int
    processed_rows: int
    fraud_detected: int

class AnalyticsSummary(BaseModel):
    total_transactions: int
    total_fraud: int
    fraud_rate: float
    avg_risk_score: float
    total_api_transactions: int
    total_csv_transactions: int
    recent_transactions: list
```

---

### Step 4: Repository, Services & Routers

#### [NEW] [transaction.py](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/backend/app/repositories/transaction.py)

```python
class TransactionRepository(BaseRepository[Transaction]):
    async def get_by_org_paginated(org_id, offset, limit, filters)
    async def get_analytics_summary(org_id) -> dict
    async def bulk_create(transactions: list) -> int
    async def get_fraud_timeline(org_id, days=30) -> list
```

#### [NEW] [prediction_service.py](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/backend/app/services/prediction_service.py)

Orchestrates: validate input → ML predict → persist transaction → return response.

```python
class PredictionService:
    def __init__(self, db, ml_engine)
    async def predict_single(org_id, request) -> PredictResponse
    async def predict_batch(org_id, transactions: list) -> list
```

#### [NEW] [csv_service.py](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/backend/app/services/csv_service.py)

Handles CSV parsing, schema validation, batch prediction:

```python
class CSVService:
    def __init__(self, db, ml_engine)
    async def process_upload(org_id, file: UploadFile) -> CSVUploadResponse
    def validate_csv_schema(df: DataFrame) -> list[str]  # returns errors
```

Required CSV columns: `transaction_external_id`, `amount`, `card_brand`, `billing_country`, `ip_address`, `device_type`, `email_domain`, `card_country`

#### [NEW] [analytics_service.py](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/backend/app/services/analytics_service.py)

Aggregation with Redis caching (60s TTL per SDD Section 44):

```python
class AnalyticsService:
    def __init__(self, db)
    async def get_summary(org_id) -> AnalyticsSummary
    async def get_fraud_timeline(org_id, days=30) -> list
```

---

### Step 5: API Routers

#### [NEW] [predictions.py](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/backend/app/routers/predictions.py)

| Endpoint | Method | Auth | Permission | Description |
|:---|:---|:---|:---|:---|
| `/api/v1/predict` | POST | JWT or API Key | `predict:realtime` | Score single transaction |
| `/api/v1/transactions/upload` | POST | JWT | `csv:upload` | Upload CSV file |
| `/api/v1/transactions` | GET | JWT | `analytics:read` | List transaction history (paginated) |
| `/api/v1/transactions/{id}` | GET | JWT | `analytics:read` | Get single transaction detail |

#### [NEW] [analytics.py](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/backend/app/routers/analytics.py)

| Endpoint | Method | Auth | Permission | Description |
|:---|:---|:---|:---|:---|
| `/api/v1/analytics/summary` | GET | JWT | `analytics:read` | Dashboard summary stats |
| `/api/v1/analytics/timeline` | GET | JWT | `analytics:read` | Fraud timeline (30-day) |

---

### Step 6: Dual Auth Dependency (JWT + API Key)

#### [MODIFY] [rbac.py](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/backend/app/core/rbac.py)

Add `get_current_user_or_apikey_claims()` dependency that:
1. Tries JWT decode first
2. If JWT fails, checks if the Bearer token is an API key (SHA-256 hash lookup in Redis → fallback to DB)
3. Returns claims dict with `org_id` from the API key's organization

This enables external merchants to call `POST /api/v1/predict` using their API keys.

---

### Step 7: Frontend Dashboard Wiring

#### [MODIFY] [api.ts](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/frontend/src/services/api.ts)

Add API client methods:
- `predictTransaction(data)` → POST `/api/v1/predict`
- `uploadCSV(file)` → POST `/api/v1/transactions/upload`
- `getTransactions(params)` → GET `/api/v1/transactions`
- `getAnalyticsSummary()` → GET `/api/v1/analytics/summary`
- `getAnalyticsTimeline()` → GET `/api/v1/analytics/timeline`

#### [MODIFY] Dashboard Pages

- [DashboardHome.tsx](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/frontend/src/pages/dashboard/DashboardHome.tsx) — Wire to analytics summary API (total transactions, fraud rate, avg risk score metric cards)
- [Transactions.tsx](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/frontend/src/pages/dashboard/Transactions.tsx) — Wire to transactions list API with pagination, add CSV upload button
- [Analytics.tsx](file:///c:/Users/Agrim%20Sharma/Desktop/flagged!/frontend/src/pages/dashboard/Analytics.tsx) — Wire to timeline API, render fraud trend chart

---

## Verification Plan

### Automated Tests
```bash
# Run Alembic migration
cd backend && alembic upgrade head

# Test prediction endpoint
curl -X POST http://localhost:8000/api/v1/predict \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"transaction_external_id":"tx_001","amount":250.00,"card_brand":"VISA","billing_country":"USA","ip_address":"192.168.1.1","device_type":"desktop","email_domain":"gmail.com","card_country":"USA"}'

# Test CSV upload
curl -X POST http://localhost:8000/api/v1/transactions/upload \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -F "file=@test_transactions.csv"

# Test analytics
curl http://localhost:8000/api/v1/analytics/summary \
  -H "Authorization: Bearer <JWT_TOKEN>"

# Verify health endpoint shows model loaded
curl http://localhost:8000/health
```

### Manual Verification
- Login via Google OAuth on frontend
- Navigate to Dashboard Home → verify live stats
- Navigate to Transactions → upload a CSV file → verify results appear in table
- Navigate to Analytics → verify fraud timeline chart renders
- Test API key auth: create an API key → use it to call `/predict`
