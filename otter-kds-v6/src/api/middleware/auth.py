"""Authentication middleware for FastAPI."""

import os
from typing import Optional
from fastapi import Request, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import jwt
import structlog

logger = structlog.get_logger()

# Security scheme for OpenAPI
security = HTTPBearer()

# Public endpoints that don't require authentication
PUBLIC_ENDPOINTS = {
    "/",
    "/health",
    "/ready",
    "/docs",
    "/openapi.json",
    "/redoc",
    "/api/auth/login",
    "/api/auth/refresh",
}


class AuthMiddleware(BaseHTTPMiddleware):
    """JWT authentication middleware."""
    
    def __init__(self, app):
        super().__init__(app)
        self.jwt_secret = os.getenv("JWT_SECRET", "your-secret-key")
        self.jwt_algorithm = "HS256"
    
    async def dispatch(self, request: Request, call_next):
        """Process each request for authentication."""
        # Skip authentication for public endpoints
        if request.url.path in PUBLIC_ENDPOINTS:
            return await call_next(request)
        
        # Skip WebSocket connections (handled separately)
        if request.url.path.startswith("/ws/"):
            return await call_next(request)
        
        # Extract token from Authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return JSONResponse(
                status_code=401,
                content={"detail": "Missing authentication token"}
            )
        
        token = auth_header.split(" ")[1]
        
        try:
            # Decode and validate JWT token
            payload = jwt.decode(
                token,
                self.jwt_secret,
                algorithms=[self.jwt_algorithm]
            )
            
            # Add user context to request state
            request.state.user_id = payload.get("user_id")
            request.state.email = payload.get("email")
            request.state.restaurant_id = payload.get("restaurant_id")
            request.state.restaurant_name = payload.get("restaurant_name")
            request.state.role = payload.get("role")
            request.state.permissions = payload.get("permissions", {})
            
            logger.info(
                "Authenticated request",
                user_id=request.state.user_id,
                restaurant_id=request.state.restaurant_id,
                path=request.url.path
            )
            
        except jwt.ExpiredSignatureError:
            return JSONResponse(
                status_code=401,
                content={"detail": "Token has expired"}
            )
        except jwt.InvalidTokenError as e:
            logger.error("Invalid token", error=str(e))
            return JSONResponse(
                status_code=401,
                content={"detail": "Invalid authentication token"}
            )
        except Exception as e:
            logger.error("Authentication error", error=str(e))
            return JSONResponse(
                status_code=500,
                content={"detail": "Authentication error"}
            )
        
        # Process the request
        response = await call_next(request)
        return response


def get_current_user(request: Request) -> dict:
    """Get current user from request state.
    
    This should be used in route handlers after middleware has run.
    """
    if not hasattr(request.state, "user_id"):
        raise HTTPException(
            status_code=401,
            detail="Not authenticated"
        )
    
    return {
        "user_id": request.state.user_id,
        "email": request.state.email,
        "restaurant_id": request.state.restaurant_id,
        "restaurant_name": request.state.restaurant_name,
        "role": request.state.role,
        "permissions": request.state.permissions
    }


def require_role(allowed_roles: list):
    """Decorator to require specific roles for an endpoint."""
    def decorator(func):
        async def wrapper(request: Request, *args, **kwargs):
            user = get_current_user(request)
            if user["role"] not in allowed_roles:
                raise HTTPException(
                    status_code=403,
                    detail=f"Requires one of roles: {allowed_roles}"
                )
            return await func(request, *args, **kwargs)
        return wrapper
    return decorator


def require_permission(permission: str):
    """Decorator to require specific permission for an endpoint."""
    def decorator(func):
        async def wrapper(request: Request, *args, **kwargs):
            user = get_current_user(request)
            if not user["permissions"].get(permission, False):
                raise HTTPException(
                    status_code=403,
                    detail=f"Requires permission: {permission}"
                )
            return await func(request, *args, **kwargs)
        return wrapper
    return decorator