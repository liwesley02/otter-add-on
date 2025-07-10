"""Authentication manager for multi-restaurant support."""

import os
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from uuid import UUID
import jwt
import structlog

from ..database import SupabaseManager
from .models import (
    LoginRequest,
    SignupRequest,
    AuthResponse,
    AuthToken,
    UserSession,
    RestaurantInfo,
    SwitchRestaurantRequest
)

logger = structlog.get_logger()


class AuthManager:
    """Manages authentication with multi-restaurant support."""
    
    def __init__(self, supabase: SupabaseManager):
        """Initialize authentication manager.
        
        Args:
            supabase: Supabase database manager instance
        """
        self.supabase = supabase
        self.jwt_secret = os.getenv("JWT_SECRET", "your-secret-key")
        self.jwt_algorithm = "HS256"
        self.token_expiry_hours = 24
    
    async def signup(self, request: SignupRequest) -> AuthResponse:
        """Sign up a new user with a new restaurant.
        
        This creates:
        1. New user account via Supabase Auth
        2. New restaurant
        3. Restaurant-user association as owner
        """
        try:
            # Create user account via Supabase Auth
            auth_response = await self.supabase.sign_up(
                email=request.email,
                password=request.password,
                metadata={"name": request.name}
            )
            
            user_id = auth_response["user"]["id"]
            
            # Create restaurant
            restaurant_data = {
                "name": request.restaurant_name,
                "location": request.restaurant_location,
                "timezone": request.timezone,
                "settings": {}
            }
            restaurant = await self.supabase.client.table("restaurants")\
                .insert(restaurant_data).execute()
            restaurant_id = restaurant.data[0]["id"]
            
            # Create restaurant-user association as owner
            association_data = {
                "restaurant_id": restaurant_id,
                "user_id": user_id,
                "role": "owner",
                "active": True
            }
            await self.supabase.client.table("restaurant_users")\
                .insert(association_data).execute()
            
            # Create user profile in public schema
            await self.supabase.client.rpc(
                "create_user_profile",
                {
                    "user_id": user_id,
                    "email": request.email,
                    "user_name": request.name
                }
            ).execute()
            
            # Generate token
            token = self._generate_token(
                user_id=user_id,
                email=request.email,
                restaurant_id=restaurant_id,
                role="owner"
            )
            
            # Build response
            restaurant_info = RestaurantInfo(
                id=restaurant_id,
                name=request.restaurant_name,
                location=request.restaurant_location,
                role="owner"
            )
            
            logger.info(
                "New restaurant signup",
                user_id=user_id,
                restaurant_id=restaurant_id,
                restaurant_name=request.restaurant_name
            )
            
            return AuthResponse(
                user_id=user_id,
                email=request.email,
                name=request.name,
                token=token,
                restaurants=[restaurant_info],
                active_restaurant=restaurant_info
            )
            
        except Exception as e:
            logger.error("Signup failed", error=str(e))
            raise
    
    async def login(self, request: LoginRequest) -> AuthResponse:
        """Log in a user, optionally to a specific restaurant."""
        try:
            # Authenticate user
            auth_response = await self.supabase.sign_in(
                email=request.email,
                password=request.password
            )
            
            user_id = auth_response["user"]["id"]
            
            # Get user data with restaurant associations
            user_data = await self.supabase.client.table("users")\
                .select("*, restaurant_users(*, restaurants(*))")\
                .eq("id", user_id)\
                .single()\
                .execute()
            
            user = user_data.data
            
            # Build restaurant list
            restaurants = []
            for ru in user.get("restaurant_users", []):
                if ru["active"] and ru.get("restaurants"):
                    restaurant = ru["restaurants"]
                    restaurants.append(RestaurantInfo(
                        id=restaurant["id"],
                        name=restaurant["name"],
                        location=restaurant.get("location"),
                        role=ru["role"]
                    ))
            
            if not restaurants:
                raise ValueError("User has no restaurant access")
            
            # Determine active restaurant
            active_restaurant = None
            if request.restaurant_id:
                # User specified a restaurant
                active_restaurant = next(
                    (r for r in restaurants if r.id == request.restaurant_id),
                    None
                )
                if not active_restaurant:
                    raise ValueError("User does not have access to specified restaurant")
            else:
                # Use first restaurant
                active_restaurant = restaurants[0]
            
            # Generate token with restaurant context
            token = self._generate_token(
                user_id=user_id,
                email=user["email"],
                restaurant_id=active_restaurant.id,
                role=active_restaurant.role
            )
            
            logger.info(
                "User login successful",
                user_id=user_id,
                email=request.email,
                restaurant_id=active_restaurant.id,
                restaurant_count=len(restaurants)
            )
            
            return AuthResponse(
                user_id=user_id,
                email=user["email"],
                name=user.get("name"),
                token=token,
                restaurants=restaurants,
                active_restaurant=active_restaurant
            )
            
        except Exception as e:
            logger.error("Login failed", error=str(e), email=request.email)
            raise
    
    async def switch_restaurant(
        self, 
        user_id: UUID, 
        request: SwitchRestaurantRequest
    ) -> AuthResponse:
        """Switch active restaurant for a multi-location user."""
        try:
            # Get user's restaurant associations
            user_data = await self.supabase.client.table("users")\
                .select("*, restaurant_users(*, restaurants(*))")\
                .eq("id", user_id)\
                .single()\
                .execute()
            
            user = user_data.data
            
            # Find requested restaurant
            target_restaurant = None
            target_role = None
            
            for ru in user.get("restaurant_users", []):
                if (ru["active"] and 
                    ru.get("restaurants") and 
                    ru["restaurant_id"] == str(request.restaurant_id)):
                    target_restaurant = ru["restaurants"]
                    target_role = ru["role"]
                    break
            
            if not target_restaurant:
                raise ValueError("User does not have access to specified restaurant")
            
            # Generate new token for the restaurant
            token = self._generate_token(
                user_id=user_id,
                email=user["email"],
                restaurant_id=request.restaurant_id,
                role=target_role
            )
            
            # Build full restaurant list
            restaurants = []
            for ru in user.get("restaurant_users", []):
                if ru["active"] and ru.get("restaurants"):
                    restaurant = ru["restaurants"]
                    restaurants.append(RestaurantInfo(
                        id=restaurant["id"],
                        name=restaurant["name"],
                        location=restaurant.get("location"),
                        role=ru["role"]
                    ))
            
            active_restaurant = RestaurantInfo(
                id=target_restaurant["id"],
                name=target_restaurant["name"],
                location=target_restaurant.get("location"),
                role=target_role
            )
            
            logger.info(
                "Restaurant switch",
                user_id=user_id,
                new_restaurant_id=request.restaurant_id,
                restaurant_name=target_restaurant["name"]
            )
            
            return AuthResponse(
                user_id=user_id,
                email=user["email"],
                name=user.get("name"),
                token=token,
                restaurants=restaurants,
                active_restaurant=active_restaurant
            )
            
        except Exception as e:
            logger.error(
                "Restaurant switch failed",
                error=str(e),
                user_id=user_id,
                target_restaurant_id=request.restaurant_id
            )
            raise
    
    def verify_token(self, token: str) -> UserSession:
        """Verify JWT token and return user session."""
        try:
            payload = jwt.decode(
                token,
                self.jwt_secret,
                algorithms=[self.jwt_algorithm]
            )
            
            # Check expiration
            expires_at = datetime.fromisoformat(payload["expires_at"])
            if expires_at < datetime.utcnow():
                raise ValueError("Token expired")
            
            return UserSession(
                user_id=payload["user_id"],
                email=payload["email"],
                name=payload.get("name"),
                active_restaurant_id=payload["restaurant_id"],
                active_restaurant_name=payload["restaurant_name"],
                role=payload["role"],
                permissions=payload.get("permissions", {}),
                expires_at=expires_at
            )
            
        except jwt.InvalidTokenError as e:
            logger.error("Invalid token", error=str(e))
            raise ValueError("Invalid token")
        except Exception as e:
            logger.error("Token verification failed", error=str(e))
            raise
    
    def _generate_token(
        self,
        user_id: str,
        email: str,
        restaurant_id: str,
        role: str,
        permissions: Optional[Dict[str, Any]] = None
    ) -> AuthToken:
        """Generate JWT token with restaurant context."""
        expires_at = datetime.utcnow() + timedelta(hours=self.token_expiry_hours)
        
        payload = {
            "user_id": user_id,
            "email": email,
            "restaurant_id": restaurant_id,
            "role": role,
            "permissions": permissions or {},
            "expires_at": expires_at.isoformat(),
            "issued_at": datetime.utcnow().isoformat()
        }
        
        # Get restaurant name for token
        # In production, this would be cached
        try:
            restaurant = self.supabase.client.table("restaurants")\
                .select("name")\
                .eq("id", restaurant_id)\
                .single()\
                .execute()
            payload["restaurant_name"] = restaurant.data["name"]
        except:
            payload["restaurant_name"] = "Unknown"
        
        access_token = jwt.encode(
            payload,
            self.jwt_secret,
            algorithm=self.jwt_algorithm
        )
        
        return AuthToken(
            access_token=access_token,
            token_type="bearer",
            expires_at=expires_at
        )
    
    async def add_user_to_restaurant(
        self,
        restaurant_id: UUID,
        email: str,
        role: str,
        added_by: UUID
    ) -> bool:
        """Add an existing user to a restaurant."""
        try:
            # Check if adder has permission
            adder_role = await self._get_user_restaurant_role(added_by, restaurant_id)
            if adder_role not in ["owner", "manager"]:
                raise ValueError("Insufficient permissions to add users")
            
            # Find user by email
            user_data = await self.supabase.client.table("users")\
                .select("id")\
                .eq("email", email)\
                .single()\
                .execute()
            
            if not user_data.data:
                raise ValueError("User not found")
            
            user_id = user_data.data["id"]
            
            # Check if association already exists
            existing = await self.supabase.client.table("restaurant_users")\
                .select("id")\
                .eq("restaurant_id", restaurant_id)\
                .eq("user_id", user_id)\
                .execute()
            
            if existing.data:
                # Update existing association
                await self.supabase.client.table("restaurant_users")\
                    .update({"role": role, "active": True})\
                    .eq("restaurant_id", restaurant_id)\
                    .eq("user_id", user_id)\
                    .execute()
            else:
                # Create new association
                association_data = {
                    "restaurant_id": restaurant_id,
                    "user_id": user_id,
                    "role": role,
                    "active": True
                }
                await self.supabase.client.table("restaurant_users")\
                    .insert(association_data)\
                    .execute()
            
            logger.info(
                "User added to restaurant",
                user_id=user_id,
                restaurant_id=restaurant_id,
                role=role,
                added_by=added_by
            )
            
            return True
            
        except Exception as e:
            logger.error(
                "Failed to add user to restaurant",
                error=str(e),
                email=email,
                restaurant_id=restaurant_id
            )
            raise
    
    async def _get_user_restaurant_role(
        self,
        user_id: UUID,
        restaurant_id: UUID
    ) -> Optional[str]:
        """Get user's role in a specific restaurant."""
        try:
            data = await self.supabase.client.table("restaurant_users")\
                .select("role")\
                .eq("user_id", user_id)\
                .eq("restaurant_id", restaurant_id)\
                .eq("active", True)\
                .single()\
                .execute()
            
            return data.data["role"] if data.data else None
            
        except Exception:
            return None