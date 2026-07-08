import uuid
import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from app.models.transaction import Transaction
from app.services.analytics_service import AnalyticsService
from app.repositories.transaction import TransactionRepository


@pytest.mark.asyncio
async def test_analytics_summary_aggregation(db_session):
    org_id = uuid.uuid4()
    
    # Seed transactions
    t1 = Transaction(
        id=uuid.uuid4(),
        organization_id=org_id,
        prediction_id=uuid.uuid4(),
        transaction_external_id="tx_1",
        amount=100.0,
        card_brand="VISA",
        billing_country="USA",
        ip_address="127.0.0.1",
        device_type="desktop",
        email_domain="gmail.com",
        card_country="USA",
        risk_score=0.2,
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
        transaction_external_id="tx_2",
        amount=500.0,
        card_brand="AMEX",
        billing_country="GBR",
        ip_address="127.0.0.1",
        device_type="mobile",
        email_domain="test.com",
        card_country="GBR",
        risk_score=0.8,
        is_fraud=True,
        prediction_details={"reasons": []},
        model_version="v1",
        threshold_used=0.5,
        source="CSV"
    )

    db_session.add(t1)
    db_session.add(t2)
    await db_session.flush()

    service = AnalyticsService(db_session)
    
    # Mock Redis GET/SET to verify fallback db execution directly
    with patch("app.core.redis.redis_manager.get", new_callable=AsyncMock) as mock_redis_get, \
         patch("app.core.redis.redis_manager.set", new_callable=AsyncMock) as mock_redis_set:
        mock_redis_get.return_value = None

        res = await service.get_summary(org_id)

        assert res.total_transactions == 2
        assert res.total_fraud == 1
        assert res.avg_risk_score == 0.5
        assert res.fraud_rate == 0.5
        assert res.source_distribution["API"] == 1
        assert res.source_distribution["CSV"] == 1
        assert len(res.top_billing_countries) == 2
        
        # Verify redis cache set was triggered
        mock_redis_set.assert_called_once()


@pytest.mark.asyncio
async def test_get_model_informatics(db_session):
    service = AnalyticsService(db_session)
    res = await service.get_model_informatics()
    assert "model_overview" in res
    assert "model_performance" in res
    assert "business_metrics" in res
    assert "model_governance" in res
    assert res["model_overview"]["active_model"] is not None

