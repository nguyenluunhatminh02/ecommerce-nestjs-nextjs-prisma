"""
Evaluation metrics for recommendation models
"""
import numpy as np
from typing import List, Dict, Tuple
from scipy.sparse import csr_matrix
from sklearn.metrics import mean_squared_error, mean_absolute_error
from scipy.sparse import issparse
from app.utils.logger import logger


def _to_dense_array(x):
    """Convert sparse or dense matrix/array to flat numpy array."""
    if issparse(x):
        return np.asarray(x.todense()).flatten()
    return np.asarray(x).flatten()


class RecommendationMetrics:
    """Calculate and track recommendation metrics"""
    
    @staticmethod
    def calculate_rmse(
        actual: csr_matrix,
        predicted: csr_matrix
    ) -> float:
        """
        Calculate Root Mean Square Error
        
        Args:
            actual: Actual interaction matrix
            predicted: Predicted interaction matrix
            
        Returns:
            RMSE value
        """
        # Get non-zero entries from actual matrix
        rows, cols = actual.nonzero()
        actual_values = _to_dense_array(actual[rows, cols])
        predicted_values = _to_dense_array(predicted[rows, cols])
        
        if len(actual_values) == 0:
            return 0.0
        
        rmse = np.sqrt(mean_squared_error(actual_values, predicted_values))
        return float(rmse)
    
    @staticmethod
    def calculate_mae(
        actual: csr_matrix,
        predicted: csr_matrix
    ) -> float:
        """
        Calculate Mean Absolute Error
        
        Args:
            actual: Actual interaction matrix
            predicted: Predicted interaction matrix
            
        Returns:
            MAE value
        """
        rows, cols = actual.nonzero()
        actual_values = _to_dense_array(actual[rows, cols])
        predicted_values = _to_dense_array(predicted[rows, cols])
        
        if len(actual_values) == 0:
            return 0.0
        
        mae = mean_absolute_error(actual_values, predicted_values)
        return float(mae)
    
    @staticmethod
    def calculate_precision_at_k(
        recommendations: List[Tuple[str, float]],
        relevant_items: set,
        k: int
    ) -> float:
        """
        Calculate Precision@K
        
        Args:
            recommendations: List of (item_id, score) tuples
            relevant_items: Set of relevant item IDs
            k: Number of recommendations to consider
            
        Returns:
            Precision@K value
        """
        if k > len(recommendations):
            k = len(recommendations)
        
        top_k = [item_id for item_id, _ in recommendations[:k]]
        relevant_in_top_k = sum(1 for item_id in top_k if item_id in relevant_items)
        
        precision = relevant_in_top_k / k if k > 0 else 0.0
        return float(precision)
    
    @staticmethod
    def calculate_recall_at_k(
        recommendations: List[Tuple[str, float]],
        relevant_items: set,
        k: int
    ) -> float:
        """
        Calculate Recall@K
        
        Args:
            recommendations: List of (item_id, score) tuples
            relevant_items: Set of relevant item IDs
            k: Number of recommendations to consider
            
        Returns:
            Recall@K value
        """
        if len(relevant_items) == 0:
            return 0.0
        
        if k > len(recommendations):
            k = len(recommendations)
        
        top_k = [item_id for item_id, _ in recommendations[:k]]
        relevant_in_top_k = sum(1 for item_id in top_k if item_id in relevant_items)
        
        recall = relevant_in_top_k / len(relevant_items)
        return float(recall)
    
    @staticmethod
    def calculate_f1_at_k(
        precision: float,
        recall: float
    ) -> float:
        """
        Calculate F1 score from precision and recall
        
        Args:
            precision: Precision value
            recall: Recall value
            
        Returns:
            F1 score
        """
        if precision + recall == 0:
            return 0.0
        
        f1 = 2 * (precision * recall) / (precision + recall)
        return float(f1)
    
    @staticmethod
    def calculate_ndcg_at_k(
        recommendations: List[Tuple[str, float]],
        relevant_items: Dict[str, float],
        k: int
    ) -> float:
        """
        Calculate Normalized Discounted Cumulative Gain@K
        
        Args:
            recommendations: List of (item_id, score) tuples
            relevant_items: Dictionary mapping item_id to relevance score
            k: Number of recommendations to consider
            
        Returns:
            NDCG@K value
        """
        if k > len(recommendations):
            k = len(recommendations)
        
        # Calculate DCG
        dcg = 0.0
        for i, (item_id, _) in enumerate(recommendations[:k]):
            relevance = relevant_items.get(item_id, 0.0)
            dcg += (2**relevance - 1) / np.log2(i + 2)
        
        # Calculate ideal DCG
        ideal_relevance = sorted(relevant_items.values(), reverse=True)[:k]
        idcg = 0.0
        for i, relevance in enumerate(ideal_relevance):
            idcg += (2**relevance - 1) / np.log2(i + 2)
        
        if idcg == 0:
            return 0.0
        
        ndcg = dcg / idcg
        return float(ndcg)
    
    @staticmethod
    def calculate_coverage(
        all_recommendations: List[List[str]],
        total_items: int
    ) -> float:
        """
        Calculate catalog coverage
        
        Args:
            all_recommendations: List of recommendation lists for all users
            total_items: Total number of items in catalog
            
        Returns:
            Coverage value (0-1)
        """
        recommended_items = set()
        for recs in all_recommendations:
            recommended_items.update(recs)
        
        coverage = len(recommended_items) / total_items if total_items > 0 else 0.0
        return float(coverage)
    
    @staticmethod
    def calculate_diversity(
        recommendations: List[str],
        item_categories: Dict[str, str]
    ) -> float:
        """
        Calculate recommendation diversity (category variety)
        
        Args:
            recommendations: List of recommended item IDs
            item_categories: Dictionary mapping item_id to category_id
            
        Returns:
            Diversity value (0-1)
        """
        if not recommendations:
            return 0.0
        
        categories = set()
        for item_id in recommendations:
            if item_id in item_categories:
                categories.add(item_categories[item_id])
        
        diversity = len(categories) / len(recommendations)
        return float(diversity)
    
    @staticmethod
    def calculate_novelty(
        recommendations: List[str],
        item_popularity: Dict[str, int],
        n_users: int
    ) -> float:
        """
        Calculate recommendation novelty (average inverse popularity)
        
        Args:
            recommendations: List of recommended item IDs
            item_popularity: Dictionary mapping item_id to interaction count
            n_users: Total number of users
            
        Returns:
            Novelty value
        """
        if not recommendations:
            return 0.0
        
        novelty_scores = []
        for item_id in recommendations:
            popularity = item_popularity.get(item_id, 1)
            novelty = -np.log2(popularity / n_users)
            novelty_scores.append(novelty)
        
        avg_novelty = np.mean(novelty_scores)
        return float(avg_novelty)
    
    @staticmethod
    def evaluate_model(
        train_matrix: csr_matrix,
        test_matrix: csr_matrix,
        predicted_matrix: csr_matrix,
        k_values: List[int] = [5, 10, 20]
    ) -> Dict[str, any]:
        """
        Comprehensive model evaluation
        
        Args:
            train_matrix: Training interaction matrix
            test_matrix: Test interaction matrix
            predicted_matrix: Predicted interaction matrix
            k_values: List of k values for precision/recall
            
        Returns:
            Dictionary with all metrics
        """
        metrics = {}
        
        # RMSE and MAE
        metrics['rmse'] = RecommendationMetrics.calculate_rmse(test_matrix, predicted_matrix)
        metrics['mae'] = RecommendationMetrics.calculate_mae(test_matrix, predicted_matrix)
        
        # Precision@K and Recall@K
        for k in k_values:
            # For each user in test set, calculate precision and recall
            precisions = []
            recalls = []
            
            test_users, test_items = test_matrix.nonzero()
            unique_users = np.unique(test_users)
            
            for user_idx in unique_users:
                # Get test items for this user
                user_test_items = set(test_items[test_users == user_idx])
                
                # Get recommendations for this user
                user_predictions = _to_dense_array(predicted_matrix[user_idx])
                top_k_indices = np.argsort(user_predictions)[::-1][:k]
                recommendations = [
                    (str(idx), float(user_predictions[idx]))
                    for idx in top_k_indices
                    if user_predictions[idx] > 0
                ]
                
                # Calculate precision and recall
                precision = RecommendationMetrics.calculate_precision_at_k(
                    recommendations, user_test_items, k
                )
                recall = RecommendationMetrics.calculate_recall_at_k(
                    recommendations, user_test_items, k
                )
                
                precisions.append(precision)
                recalls.append(recall)
            
            metrics[f'precision@{k}'] = np.mean(precisions)
            metrics[f'recall@{k}'] = np.mean(recalls)
            metrics[f'f1@{k}'] = RecommendationMetrics.calculate_f1_at_k(
                metrics[f'precision@{k}'],
                metrics[f'recall@{k}']
            )
        
        logger.info(
            "Model evaluation completed",
            extra={"metrics": metrics}
        )
        
        return metrics
    
    @staticmethod
    def log_metrics(metrics: Dict[str, any], model_type: str) -> None:
        """
        Log metrics in structured format
        
        Args:
            metrics: Dictionary of metrics
            model_type: Type of model (SVD, NMF, etc.)
        """
        log_data = {
            "event": "model_evaluation",
            "model_type": model_type,
            "metrics": metrics
        }
        logger.info(f"{model_type} model metrics", extra=log_data)
