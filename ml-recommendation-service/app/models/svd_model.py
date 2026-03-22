"""
SVD (Singular Value Decomposition) model for recommendations
"""
from typing import Dict, List, Tuple, Optional
from scipy.sparse import csr_matrix
import numpy as np
from sklearn.decomposition import TruncatedSVD
from app.models.base_model import BaseModel
from app.config import settings
from app.utils.logger import logger


class SVDModel(BaseModel):
    """SVD-based recommendation model"""
    
    def __init__(
        self,
        n_components: int = None,
        n_iter: int = None,
        random_state: int = 42
    ):
        super().__init__("SVD")
        
        self.n_components = n_components or settings.svd_n_components
        self.n_iter = n_iter or settings.svd_n_iter
        self.random_state = random_state
        
        self.hyperparameters = {
            'n_components': self.n_components,
            'n_iter': self.n_iter,
            'random_state': self.random_state
        }
        
        self.svd_model = None
    
    def train(
        self,
        interaction_matrix: csr_matrix,
        user_to_index: Dict[str, int],
        item_to_index: Dict[str, int]
    ) -> None:
        """
        Train SVD model on interaction matrix
        
        Args:
            interaction_matrix: Sparse user-item interaction matrix
            user_to_index: Mapping from user_id to matrix index
            item_to_index: Mapping from item_id to matrix index
        """
        logger.info(
            f"Training SVD model with {self.n_components} components",
            extra={
                "matrix_shape": interaction_matrix.shape,
                "nnz": interaction_matrix.nnz
            }
        )
        
        # Store mappings
        self.user_to_index = user_to_index
        self.item_to_index = item_to_index
        self.index_to_user = {idx: user for user, idx in user_to_index.items()}
        self.index_to_item = {idx: item for item, idx in item_to_index.items()}
        
        # Initialize and train SVD model
        n_components = min(self.n_components, min(interaction_matrix.shape) - 1)
        self.svd_model = TruncatedSVD(
            n_components=n_components,
            n_iter=self.n_iter,
            random_state=self.random_state,
            algorithm='randomized'
        )
        
        # Fit model on interaction matrix
        self.svd_model.fit(interaction_matrix)
        
        # Extract user and item factors
        # SVD decomposes matrix into U * Sigma * V^T
        # User factors = U * sqrt(Sigma)
        # Item factors = V * sqrt(Sigma)
        sqrt_sigma = np.sqrt(self.svd_model.singular_values_)  # 1D array
        
        self.user_factors = self.svd_model.transform(interaction_matrix)  # U * Sigma
        self.item_factors = self.svd_model.components_.T * sqrt_sigma  # V * sqrt(Sigma), broadcasting with 1D
        
        from datetime import datetime
        self.trained_at = datetime.utcnow()
        
        logger.info(
            "SVD model training completed",
            extra={
                "explained_variance_ratio": self.svd_model.explained_variance_ratio_.sum(),
                "user_factors_shape": self.user_factors.shape,
                "item_factors_shape": self.item_factors.shape
            }
        )
    
    def predict(
        self,
        user_id: str,
        top_k: int = 20,
        exclude_items: Optional[List[str]] = None
    ) -> List[Tuple[str, float]]:
        """
        Generate recommendations for a user using SVD
        
        Args:
            user_id: User ID
            top_k: Number of recommendations to return
            exclude_items: List of item IDs to exclude
            
        Returns:
            List of (item_id, score) tuples
        """
        if not self.is_trained():
            logger.warning("SVD model not trained")
            return []
        
        # Check if user exists in training data
        if user_id not in self.user_to_index:
            logger.warning(f"User {user_id} not in training data (cold start)")
            return []
        
        user_idx = self.user_to_index[user_id]
        user_vector = self.user_factors[user_idx]
        
        # Calculate predicted scores for all items
        scores = self.item_factors.dot(user_vector)
        
        # Exclude items
        if exclude_items:
            for item_id in exclude_items:
                if item_id in self.item_to_index:
                    scores[self.item_to_index[item_id]] = -np.inf
        
        # Get top-k items
        top_indices = np.argsort(scores)[::-1][:top_k]
        
        # Normalize scores to 0-1 range
        valid_scores = scores[top_indices]
        normalized_scores = self.normalize_scores(valid_scores)
        
        recommendations = [
            (self.index_to_item[idx], float(normalized_scores[i]))
            for i, idx in enumerate(top_indices)
            if scores[idx] > -np.inf
        ]
        
        return recommendations
    
    def get_similar_items(
        self,
        item_id: str,
        top_k: int = 10
    ) -> List[Tuple[str, float]]:
        """
        Find similar items using item factors
        
        Args:
            item_id: Item ID
            top_k: Number of similar items to return
            
        Returns:
            List of (item_id, similarity_score) tuples
        """
        if not self.is_trained():
            logger.warning("SVD model not trained")
            return []
        
        # Check if item exists in training data
        if item_id not in self.item_to_index:
            logger.warning(f"Item {item_id} not in training data")
            return []
        
        item_idx = self.item_to_index[item_id]
        target_vector = self.item_factors[item_idx]
        
        # Calculate cosine similarity with all items
        # Normalize vectors for cosine similarity
        target_norm = np.linalg.norm(target_vector)
        if target_norm == 0:
            return []
        
        item_norms = np.linalg.norm(self.item_factors, axis=1)
        similarities = self.item_factors.dot(target_vector) / (item_norms * target_norm + 1e-8)
        
        # Get top-k similar items (excluding the target item)
        similarities[item_idx] = -1
        top_indices = np.argsort(similarities)[::-1][:top_k]
        
        similar_items = [
            (self.index_to_item[idx], float(similarities[idx]))
            for idx in top_indices
            if similarities[idx] > 0
        ]
        
        return similar_items
    
    def predict_all_users(
        self,
        top_k: int = 20
    ) -> Dict[str, List[Tuple[str, float]]]:
        """
        Generate recommendations for all users
        
        Args:
            top_k: Number of recommendations per user
            
        Returns:
            Dictionary mapping user_id to recommendations
        """
        if not self.is_trained():
            logger.warning("SVD model not trained")
            return {}
        
        all_recommendations = {}
        
        for user_id in self.user_to_index.keys():
            recommendations = self.predict(user_id, top_k)
            all_recommendations[user_id] = recommendations
        
        logger.info(f"Generated recommendations for {len(all_recommendations)} users")
        return all_recommendations
    
    def get_user_factors(self, user_id: str) -> Optional[np.ndarray]:
        """
        Get latent factors for a user
        
        Args:
            user_id: User ID
            
        Returns:
            User factor vector or None if user not found
        """
        if not self.is_trained() or user_id not in self.user_to_index:
            return None
        
        user_idx = self.user_to_index[user_id]
        return self.user_factors[user_idx]
    
    def get_item_factors(self, item_id: str) -> Optional[np.ndarray]:
        """
        Get latent factors for an item
        
        Args:
            item_id: Item ID
            
        Returns:
            Item factor vector or None if item not found
        """
        if not self.is_trained() or item_id not in self.item_to_index:
            return None
        
        item_idx = self.item_to_index[item_id]
        return self.item_factors[item_idx]
