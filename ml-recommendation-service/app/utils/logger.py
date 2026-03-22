"""
Logging configuration for ML Recommendation Service
"""
import logging
import sys
from typing import Any
from pythonjsonlogger import jsonlogger


def setup_logger(name: str = __name__, level: str = "INFO") -> logging.Logger:
    """
    Setup and configure logger with JSON formatting
    
    Args:
        name: Logger name
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        
    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, level.upper()))
    
    # Remove existing handlers
    logger.handlers.clear()
    
    # Console handler with JSON formatting
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(getattr(logging, level.upper()))
    
    # JSON formatter for structured logging
    formatter = jsonlogger.JsonFormatter(
        '%(asctime)s %(name)s %(levelname)s %(message)s',
        timestamp=True
    )
    handler.setFormatter(formatter)
    
    logger.addHandler(handler)
    
    return logger


# Create default logger
logger = setup_logger("ml-recommendation-service")


def log_request(
    method: str,
    path: str,
    user_id: str = None,
    duration_ms: float = None,
    status_code: int = None
) -> None:
    """
    Log API request with structured data
    
    Args:
        method: HTTP method
        path: Request path
        user_id: User ID if authenticated
        duration_ms: Request duration in milliseconds
        status_code: HTTP status code
    """
    log_data = {
        "event": "api_request",
        "method": method,
        "path": path,
    }
    
    if user_id:
        log_data["user_id"] = user_id
    if duration_ms is not None:
        log_data["duration_ms"] = duration_ms
    if status_code:
        log_data["status_code"] = status_code
    
    logger.info("API request", extra=log_data)


def log_model_training(
    model_type: str,
    training_samples: int,
    test_samples: int,
    metrics: dict,
    duration_seconds: float
) -> None:
    """
    Log model training results
    
    Args:
        model_type: Type of model (SVD, NMF)
        training_samples: Number of training samples
        test_samples: Number of test samples
        metrics: Dictionary of evaluation metrics
        duration_seconds: Training duration
    """
    log_data = {
        "event": "model_training",
        "model_type": model_type,
        "training_samples": training_samples,
        "test_samples": test_samples,
        "metrics": metrics,
        "duration_seconds": duration_seconds
    }
    
    logger.info("Model training completed", extra=log_data)


def log_error(
    error_type: str,
    error_message: str,
    context: dict = None,
    exc_info: bool = False
) -> None:
    """
    Log error with context
    
    Args:
        error_type: Type of error
        error_message: Error message
        context: Additional context data
        exc_info: Include exception info
    """
    log_data = {
        "event": "error",
        "error_type": error_type,
        "error_message": error_message,
    }
    
    if context:
        log_data["context"] = context
    
    logger.error("Error occurred", extra=log_data, exc_info=exc_info)
