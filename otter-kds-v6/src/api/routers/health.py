"""Health check endpoints for monitoring."""

import time
from datetime import datetime
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from ..models.api_models import HealthResponse

router = APIRouter()

# Track server start time
SERVER_START_TIME = time.time()


@router.get("/health", response_model=HealthResponse)
async def health_check(request: Request):
    """Basic health check endpoint."""
    uptime = time.time() - SERVER_START_TIME
    
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow(),
        version="6.0.0",
        uptime_seconds=uptime,
        checks={
            "api": True
        }
    )


@router.get("/ready")
async def readiness_check(request: Request):
    """Readiness check including database connection."""
    checks = {
        "api": True,
        "database": False,
        "auth": False
    }
    
    # Check database connection
    try:
        db = request.app.state.db
        if db and db.client:
            # Try a simple query
            result = await db.test_connection()
            checks["database"] = result
            checks["auth"] = result  # Auth works if DB works
    except Exception as e:
        checks["database"] = False
        checks["auth"] = False
    
    # Determine overall status
    all_healthy = all(checks.values())
    status_code = 200 if all_healthy else 503
    
    return JSONResponse(
        status_code=status_code,
        content={
            "status": "ready" if all_healthy else "not_ready",
            "timestamp": datetime.utcnow().isoformat(),
            "checks": checks
        }
    )