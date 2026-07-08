import pytest
from httpx import AsyncClient, ASGITransport
from main import app


@pytest.mark.asyncio
async def test_liveness_probe():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        response = await client.get("/health/live")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data


@pytest.mark.asyncio
async def test_readiness_probe():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        response = await client.get("/health/ready")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ready"
        assert "components" in data


@pytest.mark.asyncio
async def test_database_probe():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        response = await client.get("/health/database")
        assert response.status_code == 200
        data = response.json()
        assert data["component"] == "database"
        assert data["status"] == "up"


@pytest.mark.asyncio
async def test_ml_probe():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        response = await client.get("/health/ml")
        assert response.status_code == 200
        data = response.json()
        assert data["component"] == "ml_engine"
        assert data["status"] == "up"
        assert "details" in data


@pytest.mark.asyncio
async def test_dependency_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        response = await client.get("/health/dependencies")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "dependencies" in data
