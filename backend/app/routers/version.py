from fastapi import APIRouter, status
from app.core.config import settings

router = APIRouter()


@router.get("/version", status_code=status.HTTP_200_OK)
async def get_version():
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "env": settings.ENV
    }
