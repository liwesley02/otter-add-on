"""Order data models for Otter KDS v6 with restaurant isolation."""

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field, field_validator, ConfigDict


class OrderStatus(str, Enum):
    """Order status enumeration."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class OrderType(str, Enum):
    """Order type enumeration."""
    DINE_IN = "dine-in"
    TAKEOUT = "takeout"
    DELIVERY = "delivery"


class ItemStatus(str, Enum):
    """Order item status enumeration."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class OrderItemBase(BaseModel):
    """Base model for order items."""
    item_name: str = Field(..., min_length=1, max_length=255)
    category: Optional[str] = Field(None, max_length=100)
    subcategory: Optional[str] = Field(None, max_length=100)
    protein_type: Optional[str] = Field(None, max_length=50)
    sauce: Optional[str] = Field(None, max_length=50)
    size: Optional[str] = Field(None, max_length=20)
    quantity: int = Field(default=1, ge=1)
    station: Optional[str] = Field(None, max_length=50)
    modifiers: Dict[str, Any] = Field(default_factory=dict)
    prep_notes: Optional[str] = Field(None, max_length=500)
    
    @field_validator('item_name')
    @classmethod
    def validate_item_name(cls, v: str) -> str:
        """Ensure item name is properly formatted."""
        return v.strip()


class OrderItemCreate(OrderItemBase):
    """Model for creating order items."""
    pass


class OrderItem(OrderItemBase):
    """Complete order item model with tracking fields."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    order_id: UUID
    status: ItemStatus = Field(default=ItemStatus.PENDING)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    completed_by: Optional[UUID] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    @property
    def prep_time_minutes(self) -> Optional[int]:
        """Calculate prep time for completed items."""
        if self.started_at and self.completed_at:
            delta = self.completed_at - self.started_at
            return int(delta.total_seconds() / 60)
        return None


class OrderBase(BaseModel):
    """Base model for orders."""
    order_number: str = Field(..., min_length=1, max_length=50)
    customer_name: Optional[str] = Field(None, max_length=100)
    customer_phone: Optional[str] = Field(None, max_length=20)
    order_type: OrderType = Field(default=OrderType.DINE_IN)
    platform: str = Field(default="otter", max_length=50)
    priority: int = Field(default=0, ge=0, le=10)
    target_time: Optional[datetime] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    @field_validator('order_number')
    @classmethod
    def validate_order_number(cls, v: str) -> str:
        """Ensure order number is properly formatted."""
        return v.strip().upper()


class OrderCreate(OrderBase):
    """Model for creating orders with restaurant context."""
    restaurant_id: UUID = Field(..., description="Restaurant ID for data isolation")
    ordered_at: datetime = Field(default_factory=datetime.utcnow)
    items: List[OrderItemCreate] = Field(default_factory=list, min_length=1)


class Order(OrderBase):
    """Complete order model with all fields."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    restaurant_id: UUID = Field(..., description="Restaurant ID for data isolation")
    status: OrderStatus = Field(default=OrderStatus.PENDING)
    ordered_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    prep_time_minutes: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Related data
    items: List[OrderItem] = Field(default_factory=list)
    
    @property
    def elapsed_minutes(self) -> int:
        """Calculate elapsed time since order was placed."""
        delta = datetime.utcnow() - self.ordered_at
        return int(delta.total_seconds() / 60)
    
    @property
    def is_late(self) -> bool:
        """Check if order is running late (>20 minutes)."""
        return self.elapsed_minutes > 20 and self.status != OrderStatus.COMPLETED
    
    @property
    def urgency_score(self) -> int:
        """Calculate urgency score based on elapsed time."""
        elapsed = self.elapsed_minutes
        if elapsed > 30:
            return 3
        elif elapsed > 20:
            return 2
        elif elapsed > 10:
            return 1
        return 0


class Restaurant(BaseModel):
    """Restaurant model for multi-location support."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    name: str = Field(..., min_length=1, max_length=255)
    location: Optional[str] = Field(None, max_length=255)
    timezone: str = Field(default="America/New_York")
    settings: Dict[str, Any] = Field(default_factory=dict)
    subscription_tier: str = Field(default="free")
    created_at: datetime
    updated_at: datetime


class RestaurantUser(BaseModel):
    """User-restaurant association for access control."""
    model_config = ConfigDict(from_attributes=True)
    
    restaurant_id: UUID
    user_id: UUID
    role: str = Field(..., pattern="^(owner|manager|chef|staff)$")
    active: bool = Field(default=True)
    
    # Joined data
    restaurant: Optional[Restaurant] = None


class UserWithRestaurants(BaseModel):
    """User model with restaurant associations."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    email: str
    name: Optional[str]
    role: str
    permissions: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    
    # Restaurant associations
    restaurants: List[RestaurantUser] = Field(default_factory=list)
    
    @property
    def active_restaurants(self) -> List[Restaurant]:
        """Get list of active restaurants for this user."""
        return [
            ru.restaurant for ru in self.restaurants 
            if ru.active and ru.restaurant
        ]
    
    def has_access_to_restaurant(self, restaurant_id: UUID) -> bool:
        """Check if user has access to a specific restaurant."""
        return any(
            ru.restaurant_id == restaurant_id and ru.active 
            for ru in self.restaurants
        )
    
    def get_role_for_restaurant(self, restaurant_id: UUID) -> Optional[str]:
        """Get user's role for a specific restaurant."""
        for ru in self.restaurants:
            if ru.restaurant_id == restaurant_id and ru.active:
                return ru.role
        return None


class BatchCreate(BaseModel):
    """Model for creating order batches."""
    batch_number: int = Field(..., ge=1)
    items: List[Dict[str, Any]] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class Batch(BaseModel):
    """Complete batch model."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    restaurant_id: UUID
    batch_number: int
    status: str = Field(default="active")
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    items: List[Dict[str, Any]] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class PrepTimeStats(BaseModel):
    """Preparation time statistics model."""
    avg_prep_time_minutes: Optional[float]
    min_prep_time_minutes: Optional[float]
    max_prep_time_minutes: Optional[float]
    total_orders: int
    items_per_order: Optional[float]


class ItemPrediction(BaseModel):
    """Item demand prediction model."""
    item_name: str
    predicted_quantity: int
    confidence_score: float = Field(ge=0.0, le=1.0)


class DemandPrediction(BaseModel):
    """Demand prediction response model."""
    restaurant_id: UUID
    prediction_time: datetime
    time_window_minutes: int
    predictions: List[ItemPrediction]
    
    @property
    def high_confidence_predictions(self) -> List[ItemPrediction]:
        """Get predictions with confidence > 0.7."""
        return [p for p in self.predictions if p.confidence_score > 0.7]