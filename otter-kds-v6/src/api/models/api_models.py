"""API request/response models for Otter KDS v6."""

from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field, EmailStr

from ...orders.models import OrderStatus, OrderType, ItemStatus


class ErrorResponse(BaseModel):
    """Standard error response."""
    detail: str
    code: Optional[str] = None
    field: Optional[str] = None


class SuccessResponse(BaseModel):
    """Standard success response."""
    message: str
    data: Optional[Dict[str, Any]] = None


# Authentication models
class LoginRequest(BaseModel):
    """Login request from Chrome extension."""
    email: EmailStr
    password: str
    restaurant_id: Optional[UUID] = None


class TokenResponse(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"
    expires_at: datetime
    restaurant_id: UUID
    restaurant_name: str
    user_role: str


# Order models
class OrderItemRequest(BaseModel):
    """Order item from Chrome extension."""
    item_name: str
    category: Optional[str] = None
    subcategory: Optional[str] = None
    protein_type: Optional[str] = None
    sauce: Optional[str] = None
    size: Optional[str] = None
    quantity: int = 1
    modifiers: Dict[str, Any] = Field(default_factory=dict)
    special_instructions: Optional[str] = None
    price: Optional[float] = None


class CreateOrderRequest(BaseModel):
    """Create order request from Chrome extension."""
    order_number: str
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    order_type: OrderType = OrderType.DINE_IN
    platform: str = "otter"
    items: List[OrderItemRequest]
    notes: Optional[str] = None
    total_amount: Optional[float] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class OrderResponse(BaseModel):
    """Order response with full details."""
    id: UUID
    restaurant_id: UUID
    order_number: str
    customer_name: Optional[str]
    customer_phone: Optional[str]
    order_type: OrderType
    platform: str
    status: OrderStatus
    priority: int
    ordered_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    prep_time_minutes: Optional[int]
    total_amount: Optional[float]
    notes: Optional[str]
    items: List[Dict[str, Any]]  # Simplified for now
    created_at: datetime
    updated_at: datetime


class UpdateOrderStatusRequest(BaseModel):
    """Update order status request."""
    status: OrderStatus
    notes: Optional[str] = None


class BatchOrdersRequest(BaseModel):
    """Create batch from multiple orders."""
    order_ids: List[UUID]
    batch_name: Optional[str] = None
    notes: Optional[str] = None


# WebSocket models
class WebSocketMessage(BaseModel):
    """WebSocket message format."""
    type: str  # order_created, order_updated, batch_created, etc.
    action: str  # create, update, delete
    data: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class SubscribeRequest(BaseModel):
    """WebSocket subscription request."""
    restaurant_id: UUID
    station: Optional[str] = None  # Subscribe to specific station only
    order_types: Optional[List[OrderType]] = None  # Filter by order types


# Analytics models
class PrepTimeStats(BaseModel):
    """Prep time statistics response."""
    avg_prep_time_minutes: float
    min_prep_time_minutes: float
    max_prep_time_minutes: float
    total_orders: int
    items_per_order: float
    time_window: str  # e.g., "1 hour", "24 hours"


# Health check models
class HealthResponse(BaseModel):
    """Health check response."""
    status: str  # healthy, degraded, unhealthy
    timestamp: datetime
    version: str
    uptime_seconds: float
    checks: Dict[str, bool]  # database: true, redis: true, etc.