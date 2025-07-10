"""Authentication endpoints."""

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
import structlog

from ...auth.manager import AuthManager
from ...auth.models import LoginRequest as AuthLoginRequest, SignupRequest
from ..models.api_models import LoginRequest, TokenResponse, ErrorResponse
from ..middleware.auth import get_current_user

router = APIRouter()
logger = structlog.get_logger()


@router.post("/login", response_model=TokenResponse)
async def login(request: Request, login_data: LoginRequest):
    """Login endpoint for Chrome extension."""
    try:
        # Get auth manager
        db = request.app.state.db
        auth_manager = AuthManager(db)
        
        # Convert to auth model
        auth_request = AuthLoginRequest(
            email=login_data.email,
            password=login_data.password,
            restaurant_id=str(login_data.restaurant_id) if login_data.restaurant_id else None
        )
        
        # Attempt login
        response = await auth_manager.login(auth_request)
        
        # Return token response
        return TokenResponse(
            access_token=response.token.access_token,
            token_type=response.token.token_type,
            expires_at=response.token.expires_at,
            restaurant_id=response.active_restaurant.id,
            restaurant_name=response.active_restaurant.name,
            user_role=response.active_restaurant.role
        )
        
    except ValueError as e:
        logger.error("Login failed", error=str(e), email=login_data.email)
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        logger.error("Login error", error=str(e), email=login_data.email)
        raise HTTPException(status_code=500, detail="Login failed")


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: Request):
    """Refresh JWT token."""
    try:
        # Get current user from middleware
        user = get_current_user(request)
        
        # Get auth manager
        db = request.app.state.db
        auth_manager = AuthManager(db)
        
        # Generate new token with same context
        new_token = auth_manager._generate_token(
            user_id=user["user_id"],
            email=user["email"],
            restaurant_id=user["restaurant_id"],
            role=user["role"],
            permissions=user["permissions"]
        )
        
        return TokenResponse(
            access_token=new_token.access_token,
            token_type=new_token.token_type,
            expires_at=new_token.expires_at,
            restaurant_id=user["restaurant_id"],
            restaurant_name=user["restaurant_name"],
            user_role=user["role"]
        )
        
    except Exception as e:
        logger.error("Token refresh failed", error=str(e))
        raise HTTPException(status_code=500, detail="Token refresh failed")


@router.get("/me")
async def get_current_user_info(request: Request):
    """Get current user information."""
    try:
        user = get_current_user(request)
        
        return {
            "user_id": user["user_id"],
            "email": user["email"],
            "restaurant": {
                "id": user["restaurant_id"],
                "name": user["restaurant_name"]
            },
            "role": user["role"],
            "permissions": user["permissions"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get user info", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get user info")


@router.post("/logout")
async def logout(request: Request):
    """Logout endpoint (client-side token removal)."""
    # For JWT, logout is typically handled client-side
    # This endpoint can be used for audit logging
    try:
        user = get_current_user(request)
        logger.info(
            "User logged out",
            user_id=user["user_id"],
            email=user["email"],
            restaurant_id=user["restaurant_id"]
        )
        
        return {"message": "Logged out successfully"}
        
    except Exception as e:
        logger.error("Logout error", error=str(e))
        return {"message": "Logout processed"}