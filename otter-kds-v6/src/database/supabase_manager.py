"""Supabase database manager for Otter KDS v6."""

import os
from typing import Optional, List, Dict, Any, Callable
from datetime import datetime, timedelta
import asyncio
from functools import wraps

from supabase import create_client, Client
from postgrest.exceptions import APIError
import structlog

logger = structlog.get_logger()


def handle_supabase_errors(func):
    """Decorator to handle Supabase errors."""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except APIError as e:
            logger.error("Supabase API error", error=str(e), function=func.__name__)
            raise
        except Exception as e:
            logger.error("Unexpected error", error=str(e), function=func.__name__)
            raise
    return wrapper


class SupabaseManager:
    """Manages all Supabase database operations."""
    
    def __init__(self, url: Optional[str] = None, key: Optional[str] = None):
        """Initialize Supabase client.
        
        Args:
            url: Supabase project URL (defaults to env var SUPABASE_URL)
            key: Supabase anon key (defaults to env var SUPABASE_KEY)
        """
        self.url = url or os.getenv("SUPABASE_URL")
        self.key = key or os.getenv("SUPABASE_KEY")
        
        if not self.url or not self.key:
            raise ValueError("Supabase URL and key must be provided")
        
        logger.info(f"Initializing Supabase client with URL: {self.url}")
        logger.info(f"Key length: {len(self.key) if self.key else 0}")
        
        try:
            self.client: Client = create_client(self.url, self.key)
            self._realtime_subscriptions: Dict[str, Any] = {}
            logger.info("Supabase client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to create Supabase client: {type(e).__name__}: {str(e)}")
            raise
    
    # Authentication methods
    @handle_supabase_errors
    async def sign_in(self, email: str, password: str) -> Dict[str, Any]:
        """Sign in a user."""
        response = self.client.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        logger.info("User signed in", email=email)
        return response.dict()
    
    @handle_supabase_errors
    async def sign_up(self, email: str, password: str, metadata: Optional[Dict] = None) -> Dict[str, Any]:
        """Sign up a new user."""
        response = self.client.auth.sign_up({
            "email": email,
            "password": password,
            "options": {"data": metadata} if metadata else {}
        })
        logger.info("User signed up", email=email)
        return response.dict()
    
    async def sign_out(self):
        """Sign out the current user."""
        self.client.auth.sign_out()
        logger.info("User signed out")
    
    # Order management
    @handle_supabase_errors
    async def create_order(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new order."""
        response = self.client.table("orders").insert(order_data).execute()
        logger.info("Order created", order_id=response.data[0]["id"])
        return response.data[0]
    
    @handle_supabase_errors
    async def get_active_orders(self, restaurant_id: str) -> List[Dict[str, Any]]:
        """Get all active orders for a restaurant."""
        response = self.client.rpc(
            "get_active_orders",
            {"p_restaurant_id": restaurant_id}
        ).execute()
        return response.data
    
    @handle_supabase_errors
    async def update_order_status(self, order_id: str, status: str) -> Dict[str, Any]:
        """Update order status."""
        update_data = {"status": status}
        if status == "in_progress":
            update_data["started_at"] = datetime.utcnow().isoformat()
        elif status == "completed":
            update_data["completed_at"] = datetime.utcnow().isoformat()
        
        response = self.client.table("orders").update(update_data).eq("id", order_id).execute()
        logger.info("Order status updated", order_id=order_id, status=status)
        return response.data[0]
    
    # Order items management
    @handle_supabase_errors
    async def create_order_items(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Create multiple order items."""
        response = self.client.table("order_items").insert(items).execute()
        logger.info("Order items created", count=len(items))
        return response.data
    
    @handle_supabase_errors
    async def update_item_status(self, item_id: str, status: str, user_id: Optional[str] = None) -> Dict[str, Any]:
        """Update order item status."""
        update_data = {"status": status}
        if status == "in_progress":
            update_data["started_at"] = datetime.utcnow().isoformat()
        elif status == "completed":
            update_data["completed_at"] = datetime.utcnow().isoformat()
            if user_id:
                update_data["completed_by"] = user_id
        
        response = self.client.table("order_items").update(update_data).eq("id", item_id).execute()
        logger.info("Item status updated", item_id=item_id, status=status)
        return response.data[0]
    
    # Analytics and predictions
    @handle_supabase_errors
    async def get_prep_time_stats(self, restaurant_id: str, time_window: str = "1 hour") -> Dict[str, Any]:
        """Get preparation time statistics."""
        response = self.client.rpc(
            "calculate_prep_time_stats",
            {
                "p_restaurant_id": restaurant_id,
                "p_time_window": time_window
            }
        ).execute()
        return response.data[0] if response.data else {}
    
    @handle_supabase_errors
    async def get_demand_predictions(self, restaurant_id: str, time_window_minutes: int = 30) -> List[Dict[str, Any]]:
        """Get demand predictions for the next time window."""
        response = self.client.rpc(
            "generate_demand_prediction",
            {
                "p_restaurant_id": restaurant_id,
                "p_time_window_minutes": time_window_minutes
            }
        ).execute()
        return response.data
    
    @handle_supabase_errors
    async def get_item_popularity(self, restaurant_id: str, day_of_week: Optional[int] = None,
                                 hour_of_day: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get item popularity analytics."""
        params = {"p_restaurant_id": restaurant_id}
        if day_of_week is not None:
            params["p_day_of_week"] = day_of_week
        if hour_of_day is not None:
            params["p_hour_of_day"] = hour_of_day
        
        response = self.client.rpc("get_item_popularity", params).execute()
        return response.data
    
    # Real-time subscriptions
    def subscribe_to_orders(self, restaurant_id: str, callback: Callable) -> str:
        """Subscribe to real-time order updates.
        
        Args:
            restaurant_id: Restaurant ID to subscribe to
            callback: Function to call when updates occur
            
        Returns:
            Subscription ID
        """
        channel = self.client.channel(f"orders:{restaurant_id}")
        
        channel.on(
            event="*",
            schema="public",
            table="orders",
            filter=f"restaurant_id=eq.{restaurant_id}",
            callback=callback
        ).subscribe()
        
        subscription_id = f"orders_{restaurant_id}"
        self._realtime_subscriptions[subscription_id] = channel
        logger.info("Subscribed to order updates", restaurant_id=restaurant_id)
        return subscription_id
    
    def subscribe_to_order_items(self, order_id: str, callback: Callable) -> str:
        """Subscribe to real-time order item updates."""
        channel = self.client.channel(f"order_items:{order_id}")
        
        channel.on(
            event="*",
            schema="public",
            table="order_items",
            filter=f"order_id=eq.{order_id}",
            callback=callback
        ).subscribe()
        
        subscription_id = f"items_{order_id}"
        self._realtime_subscriptions[subscription_id] = channel
        logger.info("Subscribed to order item updates", order_id=order_id)
        return subscription_id
    
    def unsubscribe(self, subscription_id: str):
        """Unsubscribe from real-time updates."""
        if subscription_id in self._realtime_subscriptions:
            channel = self._realtime_subscriptions[subscription_id]
            channel.unsubscribe()
            del self._realtime_subscriptions[subscription_id]
            logger.info("Unsubscribed from updates", subscription_id=subscription_id)
    
    def unsubscribe_all(self):
        """Unsubscribe from all real-time updates."""
        for subscription_id in list(self._realtime_subscriptions.keys()):
            self.unsubscribe(subscription_id)
    
    # Batch management
    @handle_supabase_errors
    async def create_batch(self, restaurant_id: str, batch_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new batch."""
        batch_data["restaurant_id"] = restaurant_id
        response = self.client.table("batches").insert(batch_data).execute()
        logger.info("Batch created", batch_id=response.data[0]["id"])
        return response.data[0]
    
    @handle_supabase_errors
    async def get_active_batches(self, restaurant_id: str) -> List[Dict[str, Any]]:
        """Get all active batches."""
        response = self.client.table("batches")\
            .select("*")\
            .eq("restaurant_id", restaurant_id)\
            .eq("status", "active")\
            .order("created_at")\
            .execute()
        return response.data
    
    # Station management
    @handle_supabase_errors
    async def get_stations(self, restaurant_id: str) -> List[Dict[str, Any]]:
        """Get all stations for a restaurant."""
        response = self.client.table("stations")\
            .select("*")\
            .eq("restaurant_id", restaurant_id)\
            .order("name")\
            .execute()
        return response.data
    
    @handle_supabase_errors
    async def update_station_items(self, station_id: str, active_items: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Update active items for a station."""
        response = self.client.table("stations")\
            .update({"active_items": active_items})\
            .eq("id", station_id)\
            .execute()
        logger.info("Station items updated", station_id=station_id, item_count=len(active_items))
        return response.data[0]
    
    # Menu sync integration
    @handle_supabase_errors
    async def create_sync_status(self, restaurant_id: str) -> Dict[str, Any]:
        """Create a new sync status entry."""
        sync_data = {
            "restaurant_id": restaurant_id,
            "status": "pending"
        }
        response = self.client.table("menu_sync_status").insert(sync_data).execute()
        logger.info("Menu sync started", sync_id=response.data[0]["id"])
        return response.data[0]
    
    @handle_supabase_errors
    async def update_sync_status(self, sync_id: str, status_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update sync status."""
        response = self.client.table("menu_sync_status")\
            .update(status_data)\
            .eq("id", sync_id)\
            .execute()
        return response.data[0]
    
    # Helper methods
    async def test_connection(self) -> bool:
        """Test the Supabase connection."""
        try:
            # Try to get the current user (will fail if not authenticated)
            user = self.client.auth.get_user()
            if user:
                logger.info("Supabase connection test successful", user_id=user.user.id)
            else:
                logger.info("Supabase connection test successful (anonymous)")
            return True
        except Exception as e:
            logger.error("Supabase connection test failed", error=str(e))
            return False