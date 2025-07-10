"""Main FastAPI application for Otter KDS v6."""

import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import structlog

# Load environment variables
load_dotenv()

from ..database import SupabaseManager
from .routers import auth, orders, websocket, health
from .middleware.auth import AuthMiddleware

# Configure structured logging
logger = structlog.get_logger()

# Global database manager
db_manager = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle."""
    global db_manager
    
    # Startup
    logger.info("Starting Otter KDS API server")
    try:
        db_manager = SupabaseManager()
        app.state.db = db_manager
        logger.info("Database connection established")
    except Exception as e:
        logger.warning("Database connection failed, running in limited mode", error=str(e))
        # Continue running without database for health checks
        app.state.db = None
    
    yield
    
    # Shutdown
    logger.info("Shutting down Otter KDS API server")
    if db_manager:
        try:
            db_manager.unsubscribe_all()
        except:
            pass


# Create FastAPI application
app = FastAPI(
    title="Otter KDS API",
    description="Kitchen Display System API for Otter order management",
    version="6.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Local development
        "chrome-extension://*",   # Chrome extensions
        "https://*.tryotter.com", # Otter domains
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Add custom authentication middleware
app.add_middleware(AuthMiddleware)

# Include routers
app.include_router(health.router, tags=["health"])
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(orders.router, prefix="/api/orders", tags=["orders"])
app.include_router(websocket.router, prefix="/ws", tags=["websocket"])

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Handle all unhandled exceptions."""
    logger.error(
        "Unhandled exception",
        error=str(exc),
        path=request.url.path,
        method=request.method
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "Otter KDS API",
        "version": "6.0.0",
        "status": "operational",
        "docs": "/docs",
        "health": "/health"
    }


if __name__ == "__main__":
    import uvicorn
    
    # Get configuration from environment
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    reload = os.getenv("API_RELOAD", "true").lower() == "true"
    
    # Run the server
    uvicorn.run(
        "src.api.main:app",
        host=host,
        port=port,
        reload=reload,
        log_config={
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "default": {
                    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                },
            },
            "handlers": {
                "default": {
                    "formatter": "default",
                    "class": "logging.StreamHandler",
                    "stream": "ext://sys.stdout",
                },
            },
            "root": {
                "level": "INFO",
                "handlers": ["default"],
            },
        }
    )