"""
Base model interface for recommendation models
"""
from abc import ABC, abstractmethod
from typing import Dict, List, Tuple, Optional
from scipy.sparse import csr_matrix
import numpy as np
import pickle
import os
from datetime import datetime
from app.config import settings
from app.utils.logger import logger


class BaseModel(ABC):
    """Abstract base class for recommendation models"""
    
    def __init__(self, model_type: str):
        self.model_type = model_type
        self.user_factors: Optional[np.ndarray] = None
        self.item_factors: Optional[np.ndarray] = None
        self.user_to_index: Dict[str, int] = {}
        self.item_to_index: Dict[str, int] = {}
        self.index_to_user: Dict[int, str] = {}
        self.index_to_item: Dict[int, str] = {}
        self.trained_at: Optional[datetime] = None
        self.version: str = "1.0.0"
        self.metrics: Dict[str, float] = {}
        self.hyperparameters: Dict[str, any] = {}
    
    @abstractmethod
    def train(
        self,
        interaction_matrix: csr_matrix,
        user_to_index: Dict[str, int],
        item_to_index: Dict[str, int]
    ) -> None:
        """
        Train the model on interaction matrix
        
        Args:
            interaction_matrix: Sparse user-item interaction matrix
            user_to_index: Mapping from user_id to matrix index
            item_to_index: Mapping from item_id to matrix index
        """
        pass
    
    @abstractmethod
    def predict(
        self,
        user_id: str,
        top_k: int = 20,
        exclude_items: Optional[List[str]] = None
    ) -> List[Tuple[str, float]]:
        """
        Generate recommendations for a user
        
        Args:
            user_id: User ID
            top_k: Number of recommendations to return
            exclude_items: List of item IDs to exclude
            
        Returns:
            List of (item_id, score) tuples
        """
        pass
    
    @abstractmethod
    def get_similar_items(
        self,
        item_id: str,
        top_k: int = 10
    ) -> List[Tuple[str, float]]:
        """
        Find similar items to a given item
        
        Args:
            item_id: Item ID
            top_k: Number of similar items to return
            
        Returns:
            List of (item_id, similarity_score) tuples
        """
        pass
    
    def save_model(self, path: Optional[str] = None) -> str:
        """
        Save model to disk
        
        Args:
            path: Path to save model (uses default if None)
            
        Returns:
            Path where model was saved
        """
        if path is None:
            path = os.path.join(settings.model_storage_path, f"{self.model_type}_model.pkl")
        
        os.makedirs(os.path.dirname(path), exist_ok=True)
        
        model_data = {
            'user_factors': self.user_factors,
            'item_factors': self.item_factors,
            'user_to_index': self.user_to_index,
            'item_to_index': self.item_to_index,
            'index_to_user': self.index_to_user,
            'index_to_item': self.index_to_item,
            'trained_at': self.trained_at,
            'version': self.version,
            'metrics': self.metrics,
            'hyperparameters': self.hyperparameters,
            'model_type': self.model_type
        }
        
        with open(path, 'wb') as f:
            pickle.dump(model_data, f)
        
        logger.info(f"Model saved to {path}")
        return path
    
    def load_model(self, path: Optional[str] = None) -> None:
        """
        Load model from disk
        
        Args:
            path: Path to load model from (uses default if None)
        """
        if path is None:
            path = os.path.join(settings.model_storage_path, f"{self.model_type}_model.pkl")
        
        if not os.path.exists(path):
            logger.warning(f"Model file not found: {path}")
            return
        
        with open(path, 'rb') as f:
            model_data = pickle.load(f)
        
        self.user_factors = model_data['user_factors']
        self.item_factors = model_data['item_factors']
        self.user_to_index = model_data['user_to_index']
        self.item_to_index = model_data['item_to_index']
        self.index_to_user = model_data['index_to_user']
        self.index_to_item = model_data['index_to_item']
        self.trained_at = model_data['trained_at']
        self.version = model_data['version']
        self.metrics = model_data['metrics']
        self.hyperparameters = model_data['hyperparameters']
        
        logger.info(f"Model loaded from {path}")
    
    def is_trained(self) -> bool:
        """Check if model has been trained"""
        return (
            self.user_factors is not None and
            self.item_factors is not None and
            self.trained_at is not None
        )
    
    def get_model_info(self) -> Dict[str, any]:
        """
        Get model information and metadata
        
        Returns:
            Dictionary with model metadata
        """
        return {
            'model_type': self.model_type,
            'version': self.version,
            'trained_at': self.trained_at.isoformat() if self.trained_at else None,
            'is_trained': self.is_trained(),
            'num_users': len(self.user_to_index),
            'num_items': len(self.item_to_index),
            'factor_dim': self.user_factors.shape[1] if self.user_factors is not None else None,
            'metrics': self.metrics,
            'hyperparameters': self.hyperparameters
        }
    
    def normalize_scores(self, scores: np.ndarray) -> np.ndarray:
        """
        Normalize prediction scores to 0-1 range
        
        Args:
            scores: Raw prediction scores
            
        Returns:
            Normalized scores
        """
        min_score = scores.min()
        max_score = scores.max()
        
        if max_score == min_score:
            return np.zeros_like(scores)
        
        normalized = (scores - min_score) / (max_score - min_score)
        return normalized
