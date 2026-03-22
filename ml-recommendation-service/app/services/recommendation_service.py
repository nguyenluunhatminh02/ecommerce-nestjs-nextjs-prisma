"""
Recommendation service for generating product recommendations
"""
from typing import List, Dict, Tuple, Optional
import numpy as np
from datetime import datetime

from app.services.data_service import data_service
from app.services.cache_service import (
    cache_service,
    get_user_recommendations_key,
    get_similar_products_key,
    get_trending_products_key
)
from app.services.training_service import training_service
from app.schemas.recommendation import (
    RecommendationItem,
    SimilarProductItem,
    TrendingProductItem,
    AlgorithmType
)
from app.utils.logger import logger


class RecommendationService:
    """Service for generating recommendations"""
    
    def __init__(self):
        self.training_service = training_service
    
    async def get_personalized_recommendations(
        self,
        user_id: str,
        limit: int = 20,
        algorithm: AlgorithmType = AlgorithmType.ENSEMBLE,
        exclude_ids: Optional[List[str]] = None,
        category_id: Optional[str] = None
    ) -> Tuple[List[RecommendationItem], Dict]:
        """
        Get personalized recommendations for a user
        
        Args:
            user_id: User ID
            limit: Number of recommendations to return
            algorithm: Algorithm to use
            exclude_ids: List of product IDs to exclude
            category_id: Filter by category
            
        Returns:
            Tuple of (recommendations, metadata)
        """
        # Check cache first
        cache_key = get_user_recommendations_key(user_id)
        cached = await cache_service.get(cache_key)
        
        if cached:
            logger.info(f"Cache hit for user {user_id}")
            return cached['recommendations'], cached['metadata']
        
        # Check if models are trained
        if not self.training_service.are_models_trained():
            logger.warning("Models not trained, returning empty recommendations")
            return [], {"error": "models_not_trained"}
        
        # Get recommendations based on algorithm
        recommendations = []
        
        if algorithm == AlgorithmType.SVD:
            svd_model = self.training_service.get_model('svd')
            if svd_model:
                recs = svd_model.predict(user_id, limit, exclude_ids)
                recommendations = [
                    RecommendationItem(
                        product_id=product_id,
                        score=score,
                        algorithm=AlgorithmType.SVD,
                        reason="svd_prediction"
                    )
                    for product_id, score in recs
                ]
        
        elif algorithm == AlgorithmType.NMF:
            nmf_model = self.training_service.get_model('nmf')
            if nmf_model:
                recs = nmf_model.predict(user_id, limit, exclude_ids)
                recommendations = [
                    RecommendationItem(
                        product_id=product_id,
                        score=score,
                        algorithm=AlgorithmType.NMF,
                        reason="nmf_prediction"
                    )
                    for product_id, score in recs
                ]
        
        elif algorithm == AlgorithmType.ENSEMBLE:
            # Combine SVD and NMF predictions
            svd_model = self.training_service.get_model('svd')
            nmf_model = self.training_service.get_model('nmf')
            
            if svd_model and nmf_model:
                svd_recs = svd_model.predict(user_id, limit * 2, exclude_ids)
                nmf_recs = nmf_model.predict(user_id, limit * 2, exclude_ids)
                
                # Combine and re-rank
                combined_scores = {}
                
                for product_id, score in svd_recs:
                    combined_scores[product_id] = combined_scores.get(product_id, 0) + score * 0.5
                
                for product_id, score in nmf_recs:
                    combined_scores[product_id] = combined_scores.get(product_id, 0) + score * 0.5
                
                # Sort by combined score
                sorted_recs = sorted(
                    combined_scores.items(),
                    key=lambda x: x[1],
                    reverse=True
                )[:limit]
                
                recommendations = [
                    RecommendationItem(
                        product_id=product_id,
                        score=score,
                        algorithm=AlgorithmType.ENSEMBLE,
                        reason="ensemble_prediction"
                    )
                    for product_id, score in sorted_recs
                ]
        
        # Filter by category if specified
        if category_id and recommendations:
            product_ids = [r.product_id for r in recommendations]
            product_details = await data_service.get_product_details(product_ids)
            
            recommendations = [
                r for r in recommendations
                if r.product_id in product_details and
                product_details[r.product_id].get('category_id') == category_id
            ]
        
        # Fetch product details for recommendations
        if recommendations:
            product_ids = [r.product_id for r in recommendations]
            product_details = await data_service.get_product_details(product_ids)
            
            # Update recommendations with product info
            for rec in recommendations:
                if rec.product_id in product_details:
                    rec.product_name = product_details[rec.product_id].get('name')
                    rec.product_price = product_details[rec.product_id].get('price')
                    rec.product_rating = product_details[rec.product_id].get('average_rating')
        
        metadata = {
            "algorithm": algorithm.value,
            "model_versions": {
                "svd": self.training_service.svd_model.version,
                "nmf": self.training_service.nmf_model.version
            },
            "generated_at": datetime.utcnow().isoformat()
        }
        
        # Cache results
        await cache_service.set(
            cache_key,
            {"recommendations": recommendations, "metadata": metadata}
        )
        
        logger.info(
            f"Generated {len(recommendations)} recommendations for user {user_id}",
            extra={
                "algorithm": algorithm.value,
                "limit": limit
            }
        )
        
        return recommendations, metadata
    
    async def get_similar_products(
        self,
        product_id: str,
        limit: int = 10,
        algorithm: AlgorithmType = AlgorithmType.SVD,
        exclude_ids: Optional[List[str]] = None
    ) -> Tuple[List[SimilarProductItem], Dict]:
        """
        Get similar products to a given product
        
        Args:
            product_id: Product ID
            limit: Number of similar products to return
            algorithm: Algorithm to use
            exclude_ids: List of product IDs to exclude
            
        Returns:
            Tuple of (similar_products, metadata)
        """
        # Check cache
        cache_key = get_similar_products_key(product_id)
        cached = await cache_service.get(cache_key)
        
        if cached:
            logger.info(f"Cache hit for product {product_id}")
            return cached['similar_products'], cached['metadata']
        
        # Check if models are trained
        if not self.training_service.are_models_trained():
            logger.warning("Models not trained, returning empty similar products")
            return [], {"error": "models_not_trained"}
        
        # Get similar products based on algorithm
        model = self.training_service.get_model(algorithm.value)
        
        if not model:
            logger.warning(f"Model {algorithm.value} not available")
            return [], {"error": "model_not_available"}
        
        similar_items = model.get_similar_items(product_id, limit * 2)
        
        # Filter excluded items
        if exclude_ids:
            similar_items = [
                (item_id, score)
                for item_id, score in similar_items
                if item_id not in exclude_ids
            ]
        
        # Convert to response format
        similar_products = [
            SimilarProductItem(
                product_id=item_id,
                similarity_score=score
            )
            for item_id, score in similar_items[:limit]
        ]
        
        # Fetch product details
        if similar_products:
            product_ids = [p.product_id for p in similar_products]
            product_details = await data_service.get_product_details(product_ids)
            
            for sp in similar_products:
                if sp.product_id in product_details:
                    sp.product_name = product_details[sp.product_id].get('name')
                    sp.product_price = product_details[sp.product_id].get('price')
        
        metadata = {
            "algorithm": algorithm.value,
            "target_product_id": product_id,
            "generated_at": datetime.utcnow().isoformat()
        }
        
        # Cache results
        await cache_service.set(
            cache_key,
            {"similar_products": similar_products, "metadata": metadata}
        )
        
        logger.info(
            f"Found {len(similar_products)} similar products for {product_id}",
            extra={"algorithm": algorithm.value, "limit": limit}
        )
        
        return similar_products, metadata
    
    async def get_trending_products(
        self,
        limit: int = 20,
        category_id: Optional[str] = None
    ) -> Tuple[List[TrendingProductItem], Dict]:
        """
        Get trending products
        
        Args:
            limit: Number of trending products to return
            category_id: Filter by category
            
        Returns:
            Tuple of (trending_products, metadata)
        """
        # Check cache
        cache_key = get_trending_products_key(category_id)
        cached = await cache_service.get(cache_key)
        
        if cached:
            logger.info("Cache hit for trending products")
            return cached['trending_products'], cached['metadata']
        
        # Fetch trending products from database
        trending_data = await data_service.get_trending_products(
            days=7,
            category_id=category_id,
            limit=limit
        )
        
        # Calculate trending score
        max_purchases = max([d.get('recent_purchases', 0) for d in trending_data] + [1])
        max_buyers = max([d.get('unique_buyers', 0) for d in trending_data] + [1])
        max_viewers = max([d.get('unique_viewers', 0) for d in trending_data] + [1])
        
        trending_products = []
        for item in trending_data:
            # Normalize and combine metrics
            purchase_score = item.get('recent_purchases', 0) / max_purchases
            buyer_score = item.get('unique_buyers', 0) / max_buyers
            viewer_score = item.get('unique_viewers', 0) / max_viewers
            
            trending_score = (
                purchase_score * 0.5 +
                buyer_score * 0.3 +
                viewer_score * 0.2
            )
            
            trending_products.append(
                TrendingProductItem(
                    product_id=str(item['product_id']),
                    trending_score=trending_score,
                    view_count=item.get('view_count', 0),
                    purchase_count=item.get('recent_purchases', 0)
                )
            )
        
        # Sort by trending score
        trending_products.sort(key=lambda x: x.trending_score, reverse=True)
        
        metadata = {
            "category_id": category_id,
            "days": 7,
            "generated_at": datetime.utcnow().isoformat()
        }
        
        # Cache results
        await cache_service.set(
            cache_key,
            {"trending_products": trending_products, "metadata": metadata}
        )
        
        logger.info(
            f"Generated {len(trending_products)} trending products",
            extra={"category_id": category_id, "limit": limit}
        )
        
        return trending_products, metadata
    
    async def get_cold_start_recommendations(
        self,
        user_id: str,
        limit: int = 10
    ) -> List[Tuple[str, float]]:
        """
        Get recommendations for cold-start users (users with no history)
        
        Args:
            user_id: User ID
            limit: Number of recommendations to return
            
        Returns:
            List of (product_id, score) tuples
        """
        # Get trending products as fallback
        trending_products, _ = await self.get_trending_products(limit)
        
        recommendations = [
            (p.product_id, p.trending_score)
            for p in trending_products
        ]
        
        logger.info(f"Generated cold-start recommendations for user {user_id}")
        return recommendations


# Global recommendation service instance
recommendation_service = RecommendationService()
