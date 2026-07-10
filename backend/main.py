import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging_config import setup_logging
from app.core.redis import redis_manager
from app.exceptions import register_exception_handlers
from app.middleware.tenant import TenantMiddleware
from app.routers import health, version, auth, organizations, predictions, analytics, api_keys, datasets

logger = logging.getLogger("app.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup structured JSON logging
    setup_logging()
    
    # Initialize Redis client pool
    redis_manager.initialize()

    # Initialize ML Engine
    from app.core.ml_engine import ml_engine
    ml_engine.initialize(version=settings.MODEL_VERSION, artifact_dir=settings.ML_ARTIFACT_DIR)
    
    # Ensure database schema has risk_threshold column
    try:
        from app.core.database import async_session_factory
        from sqlalchemy import text
        async with async_session_factory() as session:
            await session.execute(text("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS risk_threshold FLOAT NOT NULL DEFAULT 0.50"))
            await session.commit()
    except Exception as e:
        logger.warning(f"Schema migration note: {e}")

    logger.info("Application starting up...", extra={"version": settings.VERSION, "env": settings.ENV})
    
    yield

    
    # Close Redis client pool
    await redis_manager.close()
    
    logger.info("Application shutting down...")


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        debug=settings.DEBUG,
        lifespan=lifespan
    )

    # Register Tenant & Tracing Middlewares
    # Runs early in the middleware stack to configure context variables
    app.add_middleware(TenantMiddleware)

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register Exception Handlers
    register_exception_handlers(app)

    # Include Routers
    app.include_router(health.router, tags=["System"])
    app.include_router(version.router, tags=["System"])
    app.include_router(auth.router, prefix="/api/v1")
    app.include_router(organizations.router, prefix="/api/v1")
    app.include_router(predictions.router, prefix="/api/v1")
    app.include_router(analytics.router, prefix="/api/v1")
    app.include_router(api_keys.router, prefix="/api/v1")
    app.include_router(datasets.router, prefix="/api/v1")


    return app


app = create_app()
