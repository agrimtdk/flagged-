import uuid
import pytest
from unittest.mock import MagicMock
from app.models.transaction import Transaction
from app.schemas.predict import PredictRequest, TransactionFilters
from app.services.prediction_service import PredictionService
from app.services.csv_service import CSVService
from app.repositories.transaction import TransactionRepository


@pytest.mark.asyncio
async def test_prediction_service_single(db_session):
    # Mock MLEngine
    mock_ml = MagicMock()
    mock_ml.version = "v1.0.0"
    mock_ml.threshold = 0.5
    mock_ml.predict.return_value = {
        "risk_score": 0.12,
        "is_fraud": False,
        "prediction_details": {"reasons": [{"feature": "amount", "impact": 0.01}]}
    }

    org_id = uuid.uuid4()
    req = PredictRequest(
        transaction_external_id="tx_test_001",
        amount=150.0,
        card_brand="VISA",
        billing_country="USA",
        ip_address="192.168.1.1",
        device_type="desktop",
        email_domain="gmail.com",
        card_country="USA"
    )

    service = PredictionService(db_session, mock_ml)
    res = await service.predict_single(org_id, req)

    assert res.transaction_external_id == "tx_test_001"
    assert res.risk_score == 0.12
    assert res.is_fraud is False
    assert res.model_version == "v1.0.0"
    assert res.prediction_latency_ms is not None

    # Query DB to check if persisted
    repo = TransactionRepository(db_session)
    tx = await repo.get_by_prediction_id(res.prediction_id, org_id)
    assert tx is not None
    assert tx.transaction_external_id == "tx_test_001"
    assert tx.amount == 150.0
    assert tx.is_fraud is False


@pytest.mark.asyncio
async def test_prediction_batch(db_session):
    mock_ml = MagicMock()
    mock_ml.version = "v1.0.0"
    mock_ml.threshold = 0.5
    mock_ml.predict.return_value = {
        "risk_score": 0.85,
        "is_fraud": True,
        "prediction_details": {"reasons": [{"feature": "amount", "impact": 0.4}]}
    }

    org_id = uuid.uuid4()
    batch_id = uuid.uuid4()
    tx_data = [
        {
            "transaction_external_id": "tx_b1",
            "amount": 2500.0,
            "card_brand": "VISA",
            "billing_country": "USA",
            "ip_address": "127.0.0.1",
            "device_type": "mobile",
            "email_domain": "yahoo.com",
            "card_country": "USA"
        },
        {
            "transaction_external_id": "tx_b2",
            "amount": 3200.0,
            "card_brand": "AMEX",
            "billing_country": "GBR",
            "ip_address": "127.0.0.1",
            "device_type": "desktop",
            "email_domain": "yahoo.com",
            "card_country": "GBR"
        }
    ]

    service = PredictionService(db_session, mock_ml)
    items = await service.predict_batch(org_id, tx_data, batch_id)

    assert len(items) == 2
    assert items[0].transaction_external_id == "tx_b1"
    assert items[0].is_fraud is True
    assert items[1].batch_id == batch_id


@pytest.mark.asyncio
async def test_paginated_history_filters(db_session):
    # Seed mock transactions
    org_id = uuid.uuid4()
    repo = TransactionRepository(db_session)
    
    t1 = Transaction(
        id=uuid.uuid4(),
        organization_id=org_id,
        prediction_id=uuid.uuid4(),
        transaction_external_id="tx_filter_1",
        amount=100.0,
        card_brand="VISA",
        billing_country="USA",
        ip_address="127.0.0.1",
        device_type="desktop",
        email_domain="gmail.com",
        card_country="USA",
        risk_score=0.1,
        is_fraud=False,
        prediction_details={"reasons": []},
        model_version="v1",
        threshold_used=0.5,
        source="API"
    )
    t2 = Transaction(
        id=uuid.uuid4(),
        organization_id=org_id,
        prediction_id=uuid.uuid4(),
        transaction_external_id="tx_filter_2",
        amount=990.0,
        card_brand="AMEX",
        billing_country="GBR",
        ip_address="127.0.0.1",
        device_type="mobile",
        email_domain="test.com",
        card_country="GBR",
        risk_score=0.9,
        is_fraud=True,
        prediction_details={"reasons": []},
        model_version="v1",
        threshold_used=0.5,
        source="CSV"
    )

    db_session.add(t1)
    db_session.add(t2)
    await db_session.flush()

    # Test filtering by is_fraud
    f1 = TransactionFilters(is_fraud=True)
    items, total = await repo.get_paginated(1, 10, f1, org_id)
    assert total == 1
    assert items[0].transaction_external_id == "tx_filter_2"

    # Test filtering by source
    f2 = TransactionFilters(source="API")
    items, total = await repo.get_paginated(1, 10, f2, org_id)
    assert total == 1
    assert items[0].transaction_external_id == "tx_filter_1"
