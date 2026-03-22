"""
Pydantic schemas for recommendation API requests and responses
"""
from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import datetime
from enum import Enum


class AlgorithmType(str, Enum):
    """Supported recommendation algorithms"""
    SVD = "svd"
    NMF = "nmf"
    ENSEMBLE = "ensemble"


class RecommendationRequest(BaseModel):
    """Request for personalized recommendations"""
    limit: int = Field(
        default=20,
        ge=1,
        le=100,
        description="Number of recommendations to return"
    )
    algorithm: AlgorithmType = Field(
        default=AlgorithmType.ENSEMBLE,
        description="Algorithm to use for recommendations"
    )
    exclude_ids: Optional[List[str]] = Field(
        default=None,
        description="List of product IDs to exclude from recommendations"
    )
    category_id: Optional[str] = Field(
        default=None,
        description="Filter recommendations by category"
    )


class RecommendationItem(BaseModel):
    """Single recommendation item"""
    product_id: str = Field(..., description="Product ID")
    score: float = Field(..., ge=0, le=1, description="Recommendation score (0-1)")
    algorithm: AlgorithmType = Field(..., description="Algorithm that generated this recommendation")
    reason: str = Field(..., description="Reason for recommendation")


class RecommendationResponse(BaseModel):
    """Response with personalized recommendations"""
    user_id: str = Field(..., description="User ID")
    recommendations: List[RecommendationItem] = Field(..., description="List of recommended products")
    metadata: dict = Field(default_factory=dict, description="Additional metadata")
    generated_at: datetime = Field(default_factory=datetime.utcnow, description="Timestamp when recommendations were generated")


class SimilarProductsRequest(BaseModel):
    """Request for similar products"""
    limit: int = Field(
        default=10,
        ge=1,
        le=50,
        description="Number of similar products to return"
    )
    algorithm: AlgorithmType = Field(
        default=AlgorithmType.SVD,
        description="Algorithm to use for similarity"
    )
    exclude_ids: Optional[List[str]] = Field(
        default=None,
        description="List of product IDs to exclude"
    )


class SimilarProductItem(BaseModel):
    """Similar product item"""
    product_id: str = Field(..., description="Similar product ID")
    similarity_score: float = Field(..., ge=0, le=1, description="Similarity score (0-1)")


class SimilarProductsResponse(BaseModel):
    """Response with similar products"""
    product_id: str = Field(..., description="Original product ID")
    similar_products: List[SimilarProductItem] = Field(..., description="List of similar products")
    metadata: dict = Field(default_factory=dict)
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class TrendingProductsRequest(BaseModel):
    """Request for trending products"""
    limit: int = Field(
        default=20,
        ge=1,
        le=100,
        description="Number of trending products to return"
    )
    category_id: Optional[str] = Field(
        default=None,
        description="Filter by category"
    )


class TrendingProductItem(BaseModel):
    """Trending product item"""
    product_id: str = Field(..., description="Product ID")
    trending_score: float = Field(..., ge=0, description="Trending score")
    view_count: int = Field(default=0, description="Number of views")
    purchase_count: int = Field(default=0, description="Number of purchases")


class TrendingProductsResponse(BaseModel):
    """Response with trending products"""
    trending_products: List[TrendingProductItem] = Field(..., description="List of trending products")
    metadata: dict = Field(default_factory=dict)
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class TrainingRequest(BaseModel):
    """Request to trigger model training"""
    algorithm: str = Field(
        default="all",
        description="Algorithm to train: svd, nmf, or all"
    )
    force_retrain: bool = Field(
        default=False,
        description="Force retraining even if models are up to date"
    )


class TrainingStatusResponse(BaseModel):
    """Response with training status"""
    training_id: str = Field(..., description="Training job ID")
    status: str = Field(..., description="Training status: started, in_progress, completed, failed")
    progress: float = Field(..., ge=0, le=100, description="Training progress percentage")
    message: str = Field(..., description="Status message")
    models: Optional[dict] = Field(default=None, description="Model-specific status")


class ModelMetrics(BaseModel):
    """Model evaluation metrics"""
    version: str = Field(..., description="Model version")
    trained_at: datetime = Field(..., description="Training timestamp")
    metrics: dict = Field(..., description="Evaluation metrics (RMSE, MAE, etc.)")
    hyperparameters: dict = Field(default_factory=dict, description="Model hyperparameters")


class MetricsResponse(BaseModel):
    """Response with model metrics"""
    models: dict = Field(..., description="Metrics for each model")
    last_updated: datetime = Field(default_factory=datetime.utcnow)


class HealthResponse(BaseModel):
    """Health check response"""
    status: str = Field(..., description="Service status: healthy, unhealthy")
    database: str = Field(..., description="Database connection status")
    redis: str = Field(..., description="Redis connection status")
    models: dict = Field(default_factory=dict, description="Model loading status")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ErrorResponse(BaseModel):
    """Error response"""
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Error message")
    details: Optional[dict] = Field(default=None, description="Additional error details")
