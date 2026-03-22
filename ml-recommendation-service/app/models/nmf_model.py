"""
NMF (Non-negative Matrix Factorization) model for recommendations
"""
from typing import Dict, List, Tuple, Optional
from scipy.sparse import csr_matrix
import numpy as np
from sklearn.decomposition import NMF
from app.models.base_model import BaseModel
from app.config import settings
from app.utils.logger import logger


class NMFModel(BaseModel):
    """NMF-based recommendation model"""
    
    def __init__(
        self,
        n_components: int = None,
        max_iter: int = None,
        alpha: float = None,
        random_state: int = 42
    ):
        super().__init__("NMF")
        
        self.n_components = n_components or settings.nmf_n_components
        self.max_iter = max_iter or settings.nmf_max_iter
        self.alpha = alpha or settings.nmf_alpha
        self.random_state = random_state
        
        self.hyperparameters = {
            'n_components': self.n_components,
            'max_iter': self.max_iter,
            'alpha': self.alpha,
            'random_state': self.random_state
        }
        
        self.nmf_model = None
    
    def train(
        self,
        interaction_matrix: csr_matrix,
        user_to_index: Dict[str, int],
        item_to_index: Dict[str, int]
    ) -> None:
        """
        Train NMF model on interaction matrix
        
        Args:
            interaction_matrix: Sparse user-item interaction matrix
            user_to_index: Mapping from user_id to matrix index
            item_to_index: Mapping from item_id to matrix index
        """
        logger.info(
            f"Training NMF model with {self.n_components} components",
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
        
        # Cap n_components to matrix dimensions
        n_components = min(self.n_components, min(interaction_matrix.shape) - 1)
        
        # Initialize and train NMF model
        self.nmf_model = NMF(
            n_components=n_components,
            max_iter=self.max_iter,
            alpha_W=self.alpha,
            alpha_H=self.alpha,
            random_state=self.random_state,
            init='random',
            solver='mu',
            beta_loss='frobenius'
        )
        
        # Fit model on interaction matrix
        # NMF requires dense non-negative matrix
        from scipy.sparse import issparse
        dense_matrix = interaction_matrix.toarray() if issparse(interaction_matrix) else np.asarray(interaction_matrix)
        dense_matrix = np.maximum(dense_matrix, 0)  # Ensure non-negative
        
        # NMF decomposes matrix into W * H
        # W = user factors (n_users x n_components)
        # H = item factors (n_components x n_items)
        W = self.nmf_model.fit_transform(dense_matrix)
        H = self.nmf_model.components_
        
        self.user_factors = W
        self.item_factors = H.T  # Transpose to get n_items x n_components
        
        from datetime import datetime
        self.trained_at = datetime.utcnow()
        
        logger.info(
            "NMF model training completed",
            extra={
                "reconstruction_error": self.nmf_model.reconstruction_err_,
                "user_factors_shape": self.user_factors.shape,
                "item_factors_shape": self.item_factors.shape,
                "n_iterations": self.nmf_model.n_iter_
            }
        )
    
    def predict(
        self,
        user_id: str,
        top_k: int = 20,
        exclude_items: Optional[List[str]] = None
    ) -> List[Tuple[str, float]]:
        """
        Generate recommendations for a user using NMF
        
        Args:
            user_id: User ID
            top_k: Number of recommendations to return
            exclude_items: List of item IDs to exclude
            
        Returns:
            List of (item_id, score) tuples
        """
        if not self.is_trained():
            logger.warning("NMF model not trained")
            return []
        
        # Check if user exists in training data
        if user_id not in self.user_to_index:
            logger.warning(f"User {user_id} not in training data (cold start)")
            return []
        
        user_idx = self.user_to_index[user_id]
        user_vector = self.user_factors[user_idx]
        
        # Calculate predicted scores for all items
        # Reconstruct user-item scores: user_vector * item_factors^T
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
            logger.warning("NMF model not trained")
            return []
        
        # Check if item exists in training data
        if item_id not in self.item_to_index:
            logger.warning(f"Item {item_id} not in training data")
            return []
        
        item_idx = self.item_to_index[item_id]
        target_vector = self.item_factors[item_idx]
        
        # Calculate cosine similarity with all items
        # NMF factors are non-negative, which makes similarity more interpretable
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
            logger.warning("NMF model not trained")
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
    
    def get_top_items_for_factor(self, factor_idx: int, top_k: int = 10) -> List[Tuple[str, float]]:
        """
        Get top items for a specific latent factor
        
        Args:
            factor_idx: Index of the latent factor
            top_k: Number of items to return
            
        Returns:
            List of (item_id, factor_value) tuples
        """
        if not self.is_trained():
            logger.warning("NMF model not trained")
            return []
        
        if factor_idx >= self.item_factors.shape[1]:
            logger.warning(f"Factor index {factor_idx} out of range")
            return []
        
        # Get factor values for all items
        factor_values = self.item_factors[:, factor_idx]
        
        # Get top-k items with highest values for this factor
        top_indices = np.argsort(factor_values)[::-1][:top_k]
        
        top_items = [
            (self.index_to_item[idx], float(factor_values[idx]))
            for idx in top_indices
        ]
        
        return top_items
