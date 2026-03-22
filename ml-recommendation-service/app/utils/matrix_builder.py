"""
User-item matrix construction and interaction score calculation
"""
import numpy as np
import pandas as pd
from typing import Dict, Tuple, Optional
from scipy.sparse import csr_matrix
from sklearn.preprocessing import normalize
from app.utils.logger import logger


class MatrixBuilder:
    """Build user-item interaction matrices for recommendation"""
    
    # Interaction type weights
    INTERACTION_WEIGHTS = {
        'purchase': 5.0,
        'review': 3.0,
        'cart': 2.0,
        'wishlist': 1.5,
        'view': 1.0
    }
    
    def __init__(self):
        self.user_to_index: Dict[str, int] = {}
        self.item_to_index: Dict[str, int] = {}
        self.index_to_user: Dict[int, str] = {}
        self.index_to_item: Dict[int, str] = {}
    
    def calculate_interaction_score(
        self,
        interaction_type: str,
        count: int,
        rating: Optional[float] = None
    ) -> float:
        """
        Calculate composite interaction score
        
        Args:
            interaction_type: Type of interaction (purchase, review, cart, etc.)
            count: Number of interactions
            rating: User rating (for reviews)
            
        Returns:
            Calculated score
        """
        base_weight = self.INTERACTION_WEIGHTS.get(interaction_type, 1.0)
        score = base_weight * count
        
        # Adjust review score by rating
        if interaction_type == 'review' and rating is not None:
            score *= (rating / 5.0)  # Normalize rating to 0-1 range
        
        return score
    
    def build_interaction_matrix(
        self,
        interactions_df: pd.DataFrame,
        min_user_interactions: int = 5,
        min_item_interactions: int = 3
    ) -> Tuple[csr_matrix, Dict[str, int], Dict[str, int]]:
        """
        Build sparse user-item interaction matrix
        
        Args:
            interactions_df: DataFrame with user-product interactions
            min_user_interactions: Minimum interactions for a user to be included
            min_item_interactions: Minimum interactions for an item to be included
            
        Returns:
            Tuple of (sparse matrix, user_to_index, item_to_index)
        """
        logger.info("Building interaction matrix")
        
        # Calculate scores for each interaction
        interactions_df['score'] = interactions_df.apply(
            lambda row: self.calculate_interaction_score(
                row['interaction_type'],
                row['count'],
                row.get('rating')
            ),
            axis=1
        )
        
        # Aggregate scores by user-item pair
        aggregated = interactions_df.groupby(['user_id', 'product_id'])['score'].sum().reset_index()
        
        # Filter users and items with minimum interactions
        user_counts = aggregated['user_id'].value_counts()
        item_counts = aggregated['product_id'].value_counts()
        
        valid_users = user_counts[user_counts >= min_user_interactions].index
        valid_items = item_counts[item_counts >= min_item_interactions].index
        
        filtered = aggregated[
            aggregated['user_id'].isin(valid_users) & 
            aggregated['product_id'].isin(valid_items)
        ]
        
        logger.info(
            f"Filtered to {len(valid_users)} users and {len(valid_items)} items",
            extra={
                "original_users": interactions_df['user_id'].nunique(),
                "original_items": interactions_df['product_id'].nunique(),
                "filtered_users": len(valid_users),
                "filtered_items": len(valid_items),
                "interactions": len(filtered)
            }
        )
        
        # Create mappings
        unique_users = filtered['user_id'].unique()
        unique_items = filtered['product_id'].unique()
        
        self.user_to_index = {user: idx for idx, user in enumerate(unique_users)}
        self.item_to_index = {item: idx for idx, item in enumerate(unique_items)}
        self.index_to_user = {idx: user for user, idx in self.user_to_index.items()}
        self.index_to_item = {idx: item for item, idx in self.item_to_index.items()}
        
        # Build sparse matrix
        row_indices = filtered['user_id'].map(self.user_to_index).values
        col_indices = filtered['product_id'].map(self.item_to_index).values
        data = filtered['score'].values
        
        matrix_shape = (len(unique_users), len(unique_items))
        interaction_matrix = csr_matrix((data, (row_indices, col_indices)), shape=matrix_shape)
        
        logger.info(
            f"Built sparse matrix with shape {matrix_shape}",
            extra={
                "density": interaction_matrix.nnz / (matrix_shape[0] * matrix_shape[1]),
                "nnz": interaction_matrix.nnz
            }
        )
        
        return interaction_matrix, self.user_to_index, self.item_to_index
    
    def normalize_matrix(self, matrix: csr_matrix, method: str = 'l2') -> csr_matrix:
        """
        Normalize interaction matrix
        
        Args:
            matrix: Sparse matrix to normalize
            method: Normalization method ('l2', 'l1', 'max')
            
        Returns:
            Normalized sparse matrix
        """
        if method == 'l2':
            return normalize(matrix, norm='l2', axis=1)
        elif method == 'l1':
            return normalize(matrix, norm='l1', axis=1)
        elif method == 'max':
            # Normalize by maximum value per user
            row_max = matrix.max(axis=1).toarray().flatten()
            row_max[row_max == 0] = 1  # Avoid division by zero
            return matrix.multiply(1.0 / row_max)
        else:
            logger.warning(f"Unknown normalization method: {method}, returning original")
            return matrix
    
    def apply_tf_idf(self, matrix: csr_matrix) -> csr_matrix:
        """
        Apply TF-IDF weighting to interaction matrix
        
        Args:
            matrix: Sparse interaction matrix
            
        Returns:
            TF-IDF weighted matrix
        """
        # TF: Term frequency (already in matrix)
        # IDF: Inverse document frequency
        n_users, n_items = matrix.shape
        
        # Calculate IDF for each item
        item_doc_freq = np.diff(matrix.tocsc().indptr)  # Number of users who interacted with each item
        idf = np.log((n_users + 1) / (item_doc_freq + 1)) + 1
        
        # Apply IDF to each column (item)
        tf_idf_matrix = matrix.multiply(idf)
        
        logger.info("Applied TF-IDF weighting to matrix")
        return tf_idf_matrix
    
    def get_user_vector(
        self,
        user_id: str,
        interaction_matrix: csr_matrix
    ) -> Optional[np.ndarray]:
        """
        Get interaction vector for a specific user
        
        Args:
            user_id: User ID
            interaction_matrix: User-item interaction matrix
            
        Returns:
            User interaction vector or None if user not found
        """
        if user_id not in self.user_to_index:
            return None
        
        user_idx = self.user_to_index[user_id]
        return interaction_matrix[user_idx].toarray().flatten()
    
    def get_item_vector(
        self,
        item_id: str,
        interaction_matrix: csr_matrix
    ) -> Optional[np.ndarray]:
        """
        Get interaction vector for a specific item
        
        Args:
            item_id: Item ID
            interaction_matrix: User-item interaction matrix
            
        Returns:
            Item interaction vector or None if item not found
        """
        if item_id not in self.item_to_index:
            return None
        
        item_idx = self.item_to_index[item_id]
        return interaction_matrix[:, item_idx].toarray().flatten()
    
    def get_similar_items(
        self,
        item_id: str,
        item_factors: np.ndarray,
        top_k: int = 10
    ) -> list:
        """
        Find similar items based on item factors
        
        Args:
            item_id: Target item ID
            item_factors: Matrix of item latent factors
            top_k: Number of similar items to return
            
        Returns:
            List of (item_id, similarity_score) tuples
        """
        if item_id not in self.item_to_index:
            return []
        
        target_idx = self.item_to_index[item_id]
        target_vector = item_factors[target_idx]
        
        # Calculate cosine similarity with all items
        similarities = item_factors.dot(target_vector)
        
        # Get top-k similar items (excluding the target item)
        similarities[target_idx] = -1  # Exclude target
        top_indices = np.argsort(similarities)[::-1][:top_k]
        
        similar_items = [
            (self.index_to_item[idx], similarities[idx])
            for idx in top_indices
            if similarities[idx] > 0
        ]
        
        return similar_items
    
    def get_user_recommendations(
        self,
        user_id: str,
        user_factors: np.ndarray,
        item_factors: np.ndarray,
        top_k: int = 20,
        exclude_items: Optional[list] = None
    ) -> list:
        """
        Get recommendations for a user based on factorized matrices
        
        Args:
            user_id: User ID
            user_factors: Matrix of user latent factors
            item_factors: Matrix of item latent factors
            top_k: Number of recommendations to return
            exclude_items: List of item IDs to exclude
            
        Returns:
            List of (item_id, score) tuples
        """
        if user_id not in self.user_to_index:
            return []
        
        user_idx = self.user_to_index[user_id]
        user_vector = user_factors[user_idx]
        
        # Calculate predicted scores for all items
        scores = item_factors.dot(user_vector)
        
        # Exclude items
        if exclude_items:
            for item_id in exclude_items:
                if item_id in self.item_to_index:
                    scores[self.item_to_index[item_id]] = -1
        
        # Get top-k items
        top_indices = np.argsort(scores)[::-1][:top_k]
        
        recommendations = [
            (self.index_to_item[idx], float(scores[idx]))
            for idx in top_indices
            if scores[idx] > 0
        ]
        
        return recommendations
    
    def split_train_test(
        self,
        interaction_matrix: csr_matrix,
        test_ratio: float = 0.2
    ) -> Tuple[csr_matrix, csr_matrix]:
        """
        Split interaction matrix into train and test sets
        
        Args:
            interaction_matrix: Sparse interaction matrix
            test_ratio: Ratio of test data
            
        Returns:
            Tuple of (train_matrix, test_matrix)
        """
        # Create a copy for test set
        test_matrix = interaction_matrix.copy()
        train_matrix = interaction_matrix.copy()
        
        # Randomly select 20% of interactions for each user for testing
        for i in range(interaction_matrix.shape[0]):
            row = interaction_matrix.getrow(i)
            if row.nnz > 1:  # Only split if user has multiple interactions
                indices = row.indices
                n_test = max(1, int(len(indices) * test_ratio))
                test_indices = np.random.choice(indices, n_test, replace=False)
                
                # Remove test interactions from train matrix
                for idx in test_indices:
                    train_matrix[i, idx] = 0
        
        logger.info(
            f"Split matrix: Train={train_matrix.nnz}, Test={test_matrix.nnz}",
            extra={
                "train_ratio": 1 - test_ratio,
                "test_ratio": test_ratio
            }
        )
        
        return train_matrix, test_matrix


# Global matrix builder instance
matrix_builder = MatrixBuilder()
