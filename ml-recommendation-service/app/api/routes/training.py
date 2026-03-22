"""
FastAPI routes for model training endpoints
"""
from fastapi import APIRouter, HTTPException, status
from typing import Optional

from app.schemas.recommendation import (
    TrainingRequest,
    TrainingStatusResponse,
    MetricsResponse
)
from app.services.training_service import training_service
from app.utils.logger import logger, log_request, log_error


router = APIRouter(prefix="/api/v1/training", tags=["Training"])


@router.post("/train", response_model=TrainingStatusResponse)
async def train_models(request: TrainingRequest):
    """
    Trigger model training
    
    Args:
        request: Training request with algorithm and force_retrain flags
        
    Returns:
        Training job ID and status
    """
    try:
        # Validate algorithm
        valid_algorithms = ['svd', 'nmf', 'all']
        if request.algorithm not in valid_algorithms:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid algorithm. Must be one of: {', '.join(valid_algorithms)}"
            )
        
        # Start training
        training_id = await training_service.start_training(
            algorithm=request.algorithm,
            force_retrain=request.force_retrain
        )
        
        log_request(
            method="POST",
            path="/training/train",
            status_code=200
        )
        
        return TrainingStatusResponse(
            training_id=training_id,
            status="started",
            progress=0,
            message=f"Training job initiated for {request.algorithm}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        log_error("training_start_error", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start training"
        )


@router.get("/status/{training_id}", response_model=TrainingStatusResponse)
async def get_training_status(training_id: str):
    """
    Get training job status
    
    Args:
        training_id: Training job ID
        
    Returns:
        Training job status and progress
    """
    try:
        status = training_service.get_training_status(training_id)
        
        if not status:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Training job {training_id} not found"
            )
        
        log_request(
            method="GET",
            path=f"/training/status/{training_id}",
            status_code=200
        )
        
        return TrainingStatusResponse(
            training_id=training_id,
            status=status['status'],
            progress=status['progress'],
            message=status['message'],
            models=status.get('models')
        )
        
    except HTTPException:
        raise
    except Exception as e:
        log_error("training_status_error", str(e), {"training_id": training_id})
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get training status"
        )


@router.get("/metrics", response_model=MetricsResponse)
async def get_model_metrics():
    """
    Get metrics for all trained models
    
    Returns:
        Model metrics and metadata
    """
    try:
        metrics = await training_service.get_model_metrics()
        
        log_request(
            method="GET",
            path="/training/metrics",
            status_code=200
        )
        
        from datetime import datetime
        return MetricsResponse(
            models=metrics,
            last_updated=datetime.utcnow()
        )
        
    except Exception as e:
        log_error("metrics_error", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get model metrics"
        )
