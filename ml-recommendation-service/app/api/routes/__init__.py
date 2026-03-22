"""
API routes package
"""
from app.api.routes.recommendations import router as recommendations_router
from app.api.routes.training import router as training_router
from app.api.routes.health import router as health_router

__all__ = ['recommendations_router', 'training_router', 'health_router']
