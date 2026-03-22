"""
Main FastAPI application for ML Recommendation Service
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time

from app.config import settings
from app.utils.logger import logger, setup_logger
from app.api.routes import (
    recommendations_router,
    training_router,
    health_router
)
from app.services.data_service import data_service
from app.services.cache_service import cache_service
from app.services.training_service import training_service


# Initialize logger
app_logger = setup_logger("ml-recommendation-service")


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Machine Learning Recommendation Service for E-commerce Platform",
    docs_url="/docs",
    redoc_url="/redoc"
)


# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=settings.cors_allow_methods,
    allow_headers=settings.cors_allow_headers,
)


# Add request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests"""
    start_time = time.time()
    
    response = await call_next(request)
    
    process_time = (time.time() - start_time) * 1000
    response.headers["X-Process-Time"] = str(process_time)
    
    app_logger.info(
        "API request",
        extra={
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "process_time_ms": process_time
        }
    )
    
    return response


# Include routers
app.include_router(recommendations_router)
app.include_router(training_router)
app.include_router(health_router)


# Startup and shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan"""
    # Startup
    app_logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    
    try:
        # Connect to database
        await data_service.connect()
        
        # Connect to Redis
        await cache_service.connect()
        
        # Load trained models if available
        training_service.load_models()
        
        app_logger.info("Application started successfully")
        
    except Exception as e:
        app_logger.error("Failed to start application", extra={"error": str(e)})
        raise
    
    yield
    
    # Shutdown
    app_logger.info("Shutting down application")
    
    try:
        # Disconnect from database
        await data_service.disconnect()
        
        # Disconnect from Redis
        await cache_service.disconnect()
        
        app_logger.info("Application shutdown complete")
        
    except Exception as e:
        app_logger.error("Error during shutdown", extra={"error": str(e)})


# Set lifespan
app.router.lifespan_context = lifespan


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "status": "running",
        "docs": "/docs"
    }


# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    app_logger.error(
        "Unhandled exception",
        extra={
            "path": request.url.path,
            "error": str(exc),
            "type": type(exc).__name__
        },
        exc_info=True
    )
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_server_error",
            "message": "An unexpected error occurred"
        }
    )


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        log_level=settings.log_level.lower(),
        access_log=False  # Disable default access log, using custom middleware
    )
