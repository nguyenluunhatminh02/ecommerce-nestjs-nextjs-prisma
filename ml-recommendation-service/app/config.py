"""
Configuration management for ML Recommendation Service
"""
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import Optional, Union


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Application
    app_name: str = "ML Recommendation Service"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    
    # Database
    database_url: str = "postgresql://postgres:postgres@localhost:5432/ecommerce_springboot"
    database_pool_size: int = 10
    database_max_overflow: int = 20
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    redis_cache_ttl: int = 3600  # 1 hour in seconds
    redis_max_connections: int = 50
    
    # ML Models
    ml_model_dir: str = "./ml/models"
    svd_n_components: int = 100
    svd_n_iter: int = 10
    nmf_n_components: int = 100
    nmf_max_iter: int = 200
    nmf_alpha: float = 0.1
    
    # Training
    training_data_days: int = 180  # Use last 6 months of data
    min_user_interactions: int = 5  # Minimum interactions for user to be included
    min_product_interactions: int = 3  # Minimum interactions for product to be included
    train_test_split: float = 0.8  # 80% training, 20% testing
    
    # Recommendations
    default_recommendation_limit: int = 20
    max_recommendation_limit: int = 100
    cold_start_fallback_count: int = 10
    
    # API Security
    api_key: Optional[str] = None
    api_key_header: str = "X-API-Key"
    rate_limit_requests: int = 100
    rate_limit_period: int = 60  # seconds
    
    # Monitoring
    enable_metrics: bool = True
    metrics_port: int = 9090
    
    # Logging
    log_level: str = "INFO"
    log_format: str = "json"
    
    # CORS
    cors_origins: str = "*"
    cors_allow_credentials: bool = True
    cors_allow_methods: list[str] = ["*"]
    cors_allow_headers: list[str] = ["*"]

    @field_validator('cors_origins', mode='before')
    @classmethod
    def parse_cors_origins(cls, v):
        # Handle empty string
        if v is None or v == "":
            return "*"
        # Return as-is, will be converted to list when used
        return v

    @property
    def cors_origins_list(self) -> list[str]:
        """Convert cors_origins string to list"""
        if isinstance(self.cors_origins, list):
            return self.cors_origins
        if self.cors_origins == "*":
            return ["*"]
        # If it's a JSON array, parse it
        if self.cors_origins.startswith('[') and self.cors_origins.endswith(']'):
            import json
            return json.loads(self.cors_origins)
        # If it's a comma-separated string, split it
        return [origin.strip() for origin in self.cors_origins.split(',') if origin.strip()]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        protected_namespaces = ()  # Allow model_ prefix in field names


# Global settings instance
settings = Settings()
