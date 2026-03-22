"""
FastAPI routes for health check endpoints
"""
from fastapi import APIRouter
from datetime import datetime

from app.schemas.recommendation import HealthResponse
from app.services.training_service import training_service
from app.services.cache_service import cache_service
from app.services.data_service import data_service
from app.utils.logger import logger


router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint
    
    Returns:
        Service health status
    """
    # Check database connection
    db_status = "disconnected"
    try:
        if data_service.pool:
            async with data_service.pool.acquire() as conn:
                await conn.fetchval("SELECT 1")
            db_status = "connected"
    except Exception as e:
        logger.error("Database health check failed", extra={"error": str(e)})
        db_status = "disconnected"
    
    # Check Redis connection
    redis_status = "disconnected"
    try:
        if cache_service.redis:
            await cache_service.redis.ping()
            redis_status = "connected"
    except Exception as e:
        logger.error("Redis health check failed", extra={"error": str(e)})
        redis_status = "disconnected"
    
    # Check model status
    models_status = {}
    if training_service.svd_model.is_trained():
        models_status['svd'] = "loaded"
    else:
        models_status['svd'] = "not_loaded"
    
    if training_service.nmf_model.is_trained():
        models_status['nmf'] = "loaded"
    else:
        models_status['nmf'] = "not_loaded"
    
    # Overall status
    overall_status = "healthy" if (
        db_status == "connected" and
        redis_status == "connected"
    ) else "unhealthy"
    
    return HealthResponse(
        status=overall_status,
        database=db_status,
        redis=redis_status,
        models=models_status,
        timestamp=datetime.utcnow()
    )


@router.get("/ready")
async def readiness_check():
    """
    Readiness check endpoint
    
    Returns:
        Service readiness status
    """
    # Service is ready if models are trained
    is_ready = training_service.are_models_trained()
    
    if is_ready:
        return {"status": "ready"}
    else:
        return {"status": "not_ready", "reason": "Models not trained"}
