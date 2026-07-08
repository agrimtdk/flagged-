import pytest
from unittest.mock import AsyncMock, patch
from app.core.redis import RedisManager


@pytest.mark.asyncio
async def test_redis_graceful_fallback_when_offline():
    manager = RedisManager()
    # Simulate completely offline Redis (client is None or ping fails)
    manager.client = None
    
    # 1. Pinging an offline manager should return False (not crash)
    ping_status = await manager.ping()
    assert ping_status is False
    
    # 2. GET operations should return None (not raise ConnectionError)
    val = await manager.get("apikey:12345")
    assert val is None
    
    # 3. SET operations should return False (indicating fallback is required)
    set_status = await manager.set("apikey:12345", "cached_data")
    assert set_status is False


@pytest.mark.asyncio
async def test_redis_connection_exception_recovery():
    manager = RedisManager()
    mock_client = AsyncMock()
    # Set client to throw a ConnectionError on get
    mock_client.get.side_effect = Exception("Redis connection refused")
    manager.client = mock_client
    
    # Verify GET catches the exception and returns None
    val = await manager.get("apikey:12345")
    assert val is None
    mock_client.get.assert_called_once_with("apikey:12345")
