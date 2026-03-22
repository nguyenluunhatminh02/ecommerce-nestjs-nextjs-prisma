"""
FastAPI routes for recommendation endpoints
"""
from fastapi import APIRouter, HTTPException, Query, status
from typing import Optional
import time

from app.schemas.recommendation import (
    RecommendationRequest,
    RecommendationResponse,
    SimilarProductsRequest,
    SimilarProductsResponse,
    TrendingProductsRequest,
    TrendingProductsResponse,
    ErrorResponse
)
from app.services.recommendation_service import recommendation_service
from app.services.training_service import training_service
from app.utils.logger import logger, log_request, log_error


router = APIRouter(prefix="/api/v1/recommendations", tags=["Recommendations"])


@router.get("/users/{user_id}", response_model=RecommendationResponse)
async def get_user_recommendations(
    user_id: str,
    limit: int = Query(20, ge=1, le=100),
    algorithm: str = Query("ensemble", pattern="^(svd|nmf|ensemble)$"),
    exclude_ids: Optional[str] = Query(None)
):
    """
    Get personalized recommendations for a user
    
    Args:
        user_id: User ID
        limit: Number of recommendations (1-100)
        algorithm: Recommendation algorithm (svd, nmf, ensemble)
        exclude_ids: Comma-separated list of product IDs to exclude
        
    Returns:
        Personalized recommendations for the user
    """
    start_time = time.time()
    
    try:
        # Parse exclude IDs
        exclude_list = exclude_ids.split(',') if exclude_ids else None
        
        # Get recommendations
        from app.schemas.recommendation import AlgorithmType
        algo_enum = AlgorithmType(algorithm)
        
        recommendations, metadata = await recommendation_service.get_personalized_recommendations(
            user_id=user_id,
            limit=limit,
            algorithm=algo_enum,
            exclude_ids=exclude_list
        )
        
        duration_ms = (time.time() - start_time) * 1000
        
        log_request(
            method="GET",
            path=f"/recommendations/users/{user_id}",
            user_id=user_id,
            duration_ms=duration_ms,
            status_code=200
        )
        
        return RecommendationResponse(
            user_id=user_id,
            recommendations=recommendations,
            metadata=metadata
        )
        
    except ValueError as e:
        log_error("validation_error", str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid algorithm: {algorithm}"
        )
    except Exception as e:
        log_error("recommendation_error", str(e), {"user_id": user_id})
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate recommendations"
        )


@router.get("/products/{product_id}/similar", response_model=SimilarProductsResponse)
async def get_similar_products(
    product_id: str,
    limit: int = Query(10, ge=1, le=50),
    algorithm: str = Query("svd", pattern="^(svd|nmf|ensemble)$"),
    exclude_ids: Optional[str] = Query(None)
):
    """
    Get similar products to a given product
    
    Args:
        product_id: Product ID
        limit: Number of similar products (1-50)
        algorithm: Algorithm to use (svd, nmf, ensemble)
        exclude_ids: Comma-separated list of product IDs to exclude
        
    Returns:
        List of similar products
    """
    start_time = time.time()
    
    try:
        # Parse exclude IDs
        exclude_list = exclude_ids.split(',') if exclude_ids else None
        
        # Get similar products
        from app.schemas.recommendation import AlgorithmType
        algo_enum = AlgorithmType(algorithm)
        
        similar_products, metadata = await recommendation_service.get_similar_products(
            product_id=product_id,
            limit=limit,
            algorithm=algo_enum,
            exclude_ids=exclude_list
        )
        
        duration_ms = (time.time() - start_time) * 1000
        
        log_request(
            method="GET",
            path=f"/recommendations/products/{product_id}/similar",
            duration_ms=duration_ms,
            status_code=200
        )
        
        return SimilarProductsResponse(
            product_id=product_id,
            similar_products=similar_products,
            metadata=metadata
        )
        
    except ValueError as e:
        log_error("validation_error", str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid algorithm: {algorithm}"
        )
    except Exception as e:
        log_error("similarity_error", str(e), {"product_id": product_id})
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to find similar products"
        )


@router.get("/trending", response_model=TrendingProductsResponse)
async def get_trending_products(
    limit: int = Query(20, ge=1, le=100),
    category_id: Optional[str] = Query(None)
):
    """
    Get trending products
    
    Args:
        limit: Number of trending products (1-100)
        category_id: Filter by category ID (optional)
        
    Returns:
        List of trending products
    """
    start_time = time.time()
    
    try:
        # Get trending products
        trending_products, metadata = await recommendation_service.get_trending_products(
            limit=limit,
            category_id=category_id
        )
        
        duration_ms = (time.time() - start_time) * 1000
        
        log_request(
            method="GET",
            path="/recommendations/trending",
            duration_ms=duration_ms,
            status_code=200
        )
        
        return TrendingProductsResponse(
            trending_products=trending_products,
            metadata=metadata
        )
        
    except Exception as e:
        log_error("trending_error", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get trending products"
        )
