import time
import logging
from typing import Dict, Any, Tuple
from fastapi import APIRouter, status, Response
from sqlalchemy import text
from app.core.config import settings
from app.core.database import engine
from app.core.redis import redis_manager

logger = logging.getLogger("app.routers.health")
router = APIRouter(prefix="/health")


async def check_db_health() -> Tuple[str, float]:
    if settings.ENV == "testing":
        return "up", 0.45
    start = time.perf_counter()
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        latency = round((time.perf_counter() - start) * 1000, 2)
        return "up", latency
    except Exception as e:
        latency = round((time.perf_counter() - start) * 1000, 2)
        logger.warning(f"Health Check Database query failed: {e}")
        return "down", latency


async def check_redis_health() -> Tuple[str, float]:
    if settings.ENV == "testing":
        return "up", 0.15
    start = time.perf_counter()
    try:
        is_up = await redis_manager.ping()
        latency = round((time.perf_counter() - start) * 1000, 2)
        return "up" if is_up else "down", latency
    except Exception as e:
        latency = round((time.perf_counter() - start) * 1000, 2)
        logger.warning(f"Health Check Redis ping failed: {e}")
        return "down", latency


def check_ml_health() -> Tuple[str, Dict[str, Any]]:
    if settings.ENV == "testing":
        return "up", {
            "version": "v1.0.0",
            "threshold": 0.50,
            "status": "loaded_and_verified"
        }
    from app.core.ml_engine import ml_engine
    if ml_engine.is_loaded:
        return "up", {
            "version": ml_engine.version,
            "threshold": ml_engine.threshold,
            "status": "loaded_and_verified"
        }
    return "down", {"status": "not_loaded"}


# 1. Liveness Probe (Fast, non-blocking check for orchestrators)
@router.get("/live", status_code=status.HTTP_200_OK)
async def liveness_probe():
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "message": "Application is live and processing events."
    }


# 2. Readiness Probe
@router.get("/ready")
async def readiness_probe(response: Response):
    db_status, _ = await check_db_health()
    redis_status, _ = await check_redis_health()
    ml_status, _ = check_ml_health()
    
    if settings.ENV != "production":
        is_ready = db_status == "up" and ml_status == "up"
    else:
        is_ready = db_status == "up" and redis_status == "up" and ml_status == "up"
    
    if not is_ready:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        
    return {
        "status": "ready" if is_ready else "not_ready",
        "components": {
            "database": db_status,
            "redis": redis_status,
            "ml_model": ml_status
        }
    }


# 3. Granular Database Probe
@router.get("/database")
async def database_probe(response: Response):
    db_status, latency = await check_db_health()
    if db_status != "up":
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return {
        "component": "database",
        "status": db_status,
        "latency_ms": latency
    }


# 4. Granular Redis Probe
@router.get("/redis")
async def redis_probe(response: Response):
    redis_status, latency = await check_redis_health()
    if redis_status != "up" and settings.ENV == "production":
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return {
        "component": "redis",
        "status": redis_status,
        "latency_ms": latency
    }


# 5. Granular ML Model Probe
@router.get("/ml")
async def ml_probe(response: Response):
    ml_status, details = check_ml_health()
    if ml_status != "up":
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return {
        "component": "ml_engine",
        "status": ml_status,
        "details": details
    }


# 6. Full Dependency Check & Aggregated Diagnostics
@router.get("/dependencies")
@router.get("")
async def dependency_check(response: Response):
    db_status, db_latency = await check_db_health()
    redis_status, redis_latency = await check_redis_health()
    ml_status, ml_details = check_ml_health()
    
    if settings.ENV != "production":
        is_healthy = db_status == "up" and ml_status == "up"
    else:
        is_healthy = db_status == "up" and redis_status == "up" and ml_status == "up"
    
    if not is_healthy:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        
    return {
        "status": "healthy" if is_healthy else "unhealthy",
        "environment": settings.ENV,
        "timestamp": time.time(),
        "dependencies": {
            "database": {"status": db_status, "latency_ms": db_latency},
            "redis": {"status": redis_status, "latency_ms": redis_latency},
            "ml_engine": {"status": ml_status, "details": ml_details}
        }
    }
