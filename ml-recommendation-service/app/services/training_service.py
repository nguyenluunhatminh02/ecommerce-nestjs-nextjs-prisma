"""
Model training service for recommendation models
"""
import asyncio
import time
import uuid
from typing import Dict, List, Optional
from datetime import datetime
import pandas as pd
from scipy.sparse import csr_matrix

from app.models.svd_model import SVDModel
from app.models.nmf_model import NMFModel
from app.services.data_service import data_service
from app.services.cache_service import cache_service, get_model_key
from app.utils.matrix_builder import matrix_builder
from app.utils.metrics import RecommendationMetrics
from app.utils.logger import logger, log_model_training
from app.config import settings


class TrainingService:
    """Service for training and evaluating recommendation models"""
    
    def __init__(self):
        self.svd_model = SVDModel()
        self.nmf_model = NMFModel()
        self.training_jobs: Dict[str, Dict] = {}
    
    async def start_training(
        self,
        algorithm: str = "all",
        force_retrain: bool = False
    ) -> str:
        """
        Start model training job
        
        Args:
            algorithm: Algorithm to train ('svd', 'nmf', or 'all')
            force_retrain: Force retraining even if models are up to date
            
        Returns:
            Training job ID
        """
        training_id = str(uuid.uuid4())
        
        self.training_jobs[training_id] = {
            'status': 'started',
            'progress': 0,
            'message': 'Training job initiated',
            'models': {}
        }
        
        # Start training in background
        asyncio.create_task(self._train_models(training_id, algorithm, force_retrain))
        
        logger.info(f"Training job {training_id} started for {algorithm}")
        return training_id
    
    async def _train_models(
        self,
        training_id: str,
        algorithm: str,
        force_retrain: bool
    ) -> None:
        """
        Internal method to train models
        
        Args:
            training_id: Training job ID
            algorithm: Algorithm to train
            force_retrain: Force retraining flag
        """
        try:
            self.training_jobs[training_id]['status'] = 'in_progress'
            self.training_jobs[training_id]['message'] = 'Extracting data...'
            self.training_jobs[training_id]['progress'] = 10
            
            # Step 1: Extract data
            interactions_df = await data_service.get_user_interactions()
            
            if interactions_df.empty:
                self.training_jobs[training_id]['status'] = 'failed'
                self.training_jobs[training_id]['message'] = 'No interaction data available'
                logger.error("Training failed: No interaction data")
                return
            
            # Step 2: Build interaction matrix
            self.training_jobs[training_id]['message'] = 'Building interaction matrix...'
            self.training_jobs[training_id]['progress'] = 30
            
            interaction_matrix, user_to_index, item_to_index = matrix_builder.build_interaction_matrix(
                interactions_df,
                min_user_interactions=settings.min_user_interactions,
                min_item_interactions=settings.min_product_interactions
            )
            
            # Step 3: Split train/test
            self.training_jobs[training_id]['message'] = 'Splitting data...'
            self.training_jobs[training_id]['progress'] = 40
            
            train_matrix, test_matrix = matrix_builder.split_train_test(
                interaction_matrix,
                test_ratio=1 - settings.train_test_split
            )
            
            # Train models based on algorithm parameter
            models_to_train = []
            if algorithm in ['svd', 'all']:
                models_to_train.append(('SVD', self.svd_model))
            if algorithm in ['nmf', 'all']:
                models_to_train.append(('NMF', self.nmf_model))
            
            total_models = len(models_to_train)
            
            for i, (model_name, model) in enumerate(models_to_train):
                progress_step = 40 + (i * 50 / total_models)
                self.training_jobs[training_id]['message'] = f'Training {model_name} model...'
                self.training_jobs[training_id]['progress'] = progress_step
                
                # Train model
                start_time = time.time()
                model.train(train_matrix, user_to_index, item_to_index)
                training_time = time.time() - start_time
                
                # Evaluate model
                self.training_jobs[training_id]['message'] = f'Evaluating {model_name} model...'
                progress_step = 40 + ((i + 0.5) * 50 / total_models)
                self.training_jobs[training_id]['progress'] = progress_step
                
                # Generate predictions (n_users x n_items)
                predicted_matrix = model.user_factors @ model.item_factors.T
                
                # Calculate metrics
                metrics = RecommendationMetrics.evaluate_model(
                    train_matrix, test_matrix, predicted_matrix
                )
                
                model.metrics = metrics
                log_model_training(
                    model_name,
                    len(user_to_index),
                    len(item_to_index),
                    metrics,
                    training_time
                )
                
                # Save model
                model.save_model()
                
                # Cache model metadata
                await cache_service.set(
                    get_model_key(model_name.lower()),
                    model.get_model_info(),
                    ttl=86400  # 24 hours
                )
                
                self.training_jobs[training_id]['models'][model_name.lower()] = {
                    'status': 'completed',
                    'metrics': metrics
                }
            
            # Training complete
            self.training_jobs[training_id]['status'] = 'completed'
            self.training_jobs[training_id]['message'] = 'Training completed successfully'
            self.training_jobs[training_id]['progress'] = 100
            
            logger.info(f"Training job {training_id} completed")
            
        except Exception as e:
            self.training_jobs[training_id]['status'] = 'failed'
            self.training_jobs[training_id]['message'] = f'Training failed: {str(e)}'
            logger.error("Training job failed", extra={"training_id": training_id, "error": str(e)})
    
    def get_training_status(self, training_id: str) -> Optional[Dict]:
        """
        Get status of a training job
        
        Args:
            training_id: Training job ID
            
        Returns:
            Training job status or None if not found
        """
        return self.training_jobs.get(training_id)
    
    async def get_model_metrics(self) -> Dict[str, Dict]:
        """
        Get metrics for all trained models
        
        Returns:
            Dictionary with model metrics
        """
        models = {}
        
        # Check SVD model
        if self.svd_model.is_trained():
            models['svd'] = {
                'version': self.svd_model.version,
                'trained_at': self.svd_model.trained_at.isoformat(),
                'metrics': self.svd_model.metrics,
                'hyperparameters': self.svd_model.hyperparameters
            }
        
        # Check NMF model
        if self.nmf_model.is_trained():
            models['nmf'] = {
                'version': self.nmf_model.version,
                'trained_at': self.nmf_model.trained_at.isoformat(),
                'metrics': self.nmf_model.metrics,
                'hyperparameters': self.nmf_model.hyperparameters
            }
        
        return models
    
    def load_models(self) -> bool:
        """
        Load trained models from disk
        
        Returns:
            True if models loaded successfully, False otherwise
        """
        try:
            self.svd_model.load_model()
            self.nmf_model.load_model()
            
            logger.info("Models loaded successfully")
            return True
        except Exception as e:
            logger.error("Failed to load models", extra={"error": str(e)})
            return False
    
    def are_models_trained(self) -> bool:
        """
        Check if models are trained
        
        Returns:
            True if both models are trained
        """
        return (
            self.svd_model.is_trained() and
            self.nmf_model.is_trained()
        )
    
    def get_model(self, model_type: str):
        """
        Get model by type
        
        Args:
            model_type: Model type ('svd' or 'nmf')
            
        Returns:
            Model instance or None
        """
        if model_type.lower() == 'svd':
            return self.svd_model
        elif model_type.lower() == 'nmf':
            return self.nmf_model
        else:
            return None


# Global training service instance
training_service = TrainingService()
