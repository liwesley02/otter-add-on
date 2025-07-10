"""Authentication models for multi-restaurant support."""

from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, field_validator


class LoginRequest(BaseModel):
    """Login request model."""
    email: EmailStr
    password: str = Field(..., min_length=8)
    restaurant_id: Optional[UUID] = Field(
        None, 
        description="Specific restaurant to log into (for multi-location users)"
    )


class SignupRequest(BaseModel):
    """Signup request model for new restaurants."""
    # User info
    email: EmailStr
    password: str = Field(..., min_length=8)
    name: str = Field(..., min_length=1, max_length=100)
    
    # Restaurant info
    restaurant_name: str = Field(..., min_length=1, max_length=255)
    restaurant_location: Optional[str] = Field(None, max_length=255)
    timezone: str = Field(default="America/New_York")
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Ensure password meets security requirements."""
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class AuthToken(BaseModel):
    """Authentication token model."""
    access_token: str
    token_type: str = "bearer"
    expires_at: datetime
    refresh_token: Optional[str] = None


class RestaurantInfo(BaseModel):
    """Basic restaurant information for auth responses."""
    id: UUID
    name: str
    location: Optional[str]
    role: str  # User's role in this restaurant


class AuthResponse(BaseModel):
    """Authentication response model."""
    user_id: UUID
    email: str
    name: Optional[str]
    token: AuthToken
    restaurants: List[RestaurantInfo]
    active_restaurant: Optional[RestaurantInfo] = None
    
    @property
    def has_multiple_restaurants(self) -> bool:
        """Check if user has access to multiple restaurants."""
        return len(self.restaurants) > 1


class UserSession(BaseModel):
    """User session model with restaurant context."""
    user_id: UUID
    email: str
    name: Optional[str]
    active_restaurant_id: UUID
    active_restaurant_name: str
    role: str  # Role in active restaurant
    permissions: Dict[str, Any] = Field(default_factory=dict)
    expires_at: datetime
    
    def has_permission(self, permission: str) -> bool:
        """Check if user has a specific permission."""
        # Owner has all permissions
        if self.role == "owner":
            return True
        
        # Check specific permissions
        return self.permissions.get(permission, False)
    
    def can_manage_orders(self) -> bool:
        """Check if user can manage orders."""
        return self.role in ["owner", "manager", "chef"]
    
    def can_view_analytics(self) -> bool:
        """Check if user can view analytics."""
        return self.role in ["owner", "manager"]
    
    def can_manage_staff(self) -> bool:
        """Check if user can manage staff."""
        return self.role in ["owner", "manager"]


class SwitchRestaurantRequest(BaseModel):
    """Request to switch active restaurant for multi-location users."""
    restaurant_id: UUID


class RestaurantAccessRequest(BaseModel):
    """Request to add a user to a restaurant."""
    email: EmailStr
    role: str = Field(..., pattern="^(owner|manager|chef|staff)$")
    permissions: Dict[str, Any] = Field(default_factory=dict)