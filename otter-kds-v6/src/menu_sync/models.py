"""Data models for Otter menu synchronization."""

from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator


class MenuItemOption(BaseModel):
    """Model for menu item options/modifiers."""
    
    id: str = Field(..., description="Unique option identifier")
    name: str = Field(..., min_length=1, max_length=255)
    price: Decimal = Field(..., ge=0, decimal_places=2)
    available: bool = Field(default=True)
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Ensure name is properly formatted."""
        return v.strip()


class MenuItem(BaseModel):
    """Model for individual menu items."""
    
    id: str = Field(..., description="Unique menu item identifier")
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    price: Decimal = Field(..., ge=0, decimal_places=2)
    category: str = Field(..., min_length=1, max_length=100)
    available: bool = Field(default=True)
    options: List[MenuItemOption] = Field(default_factory=list)
    images: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    nutritional_info: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Ensure name is properly formatted."""
        return v.strip()
    
    @field_validator('category')
    @classmethod
    def validate_category(cls, v: str) -> str:
        """Ensure category is properly formatted."""
        return v.strip().title()


class MenuCategory(BaseModel):
    """Model for menu categories."""
    
    id: str = Field(..., description="Unique category identifier")
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    display_order: int = Field(default=0)
    items: List[MenuItem] = Field(default_factory=list)
    active: bool = Field(default=True)
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Ensure name is properly formatted."""
        return v.strip().title()


class Menu(BaseModel):
    """Model for complete menu."""
    
    id: str = Field(..., description="Unique menu identifier")
    restaurant_id: str = Field(..., description="Restaurant identifier")
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    categories: List[MenuCategory] = Field(default_factory=list)
    currency: str = Field(default="USD", pattern="^[A-Z]{3}$")
    active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    version: int = Field(default=1, ge=1)
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Ensure name is properly formatted."""
        return v.strip()


class SyncStatus(BaseModel):
    """Model for sync operation status."""
    
    status: str = Field(..., pattern="^(pending|in_progress|completed|failed)$")
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    items_processed: int = Field(default=0, ge=0)
    items_created: int = Field(default=0, ge=0)
    items_updated: int = Field(default=0, ge=0)
    items_deleted: int = Field(default=0, ge=0)
    errors: List[str] = Field(default_factory=list)
    
    def mark_completed(self) -> None:
        """Mark sync as completed."""
        self.status = "completed"
        self.completed_at = datetime.utcnow()
    
    def add_error(self, error: str) -> None:
        """Add an error to the sync status."""
        self.errors.append(error)
        self.status = "failed"


class SyncResponse(BaseModel):
    """Model for API sync response."""
    
    status: str = Field(..., pattern="^(success|error)$")
    data: Optional[Menu] = None
    sync_status: Optional[SyncStatus] = None
    error: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class MenuDiff(BaseModel):
    """Model for tracking menu differences."""
    
    added_items: List[MenuItem] = Field(default_factory=list)
    updated_items: List[MenuItem] = Field(default_factory=list)
    deleted_items: List[str] = Field(default_factory=list)
    added_categories: List[MenuCategory] = Field(default_factory=list)
    updated_categories: List[MenuCategory] = Field(default_factory=list)
    deleted_categories: List[str] = Field(default_factory=list)
    
    @property
    def has_changes(self) -> bool:
        """Check if there are any changes."""
        return bool(
            self.added_items or self.updated_items or self.deleted_items or
            self.added_categories or self.updated_categories or self.deleted_categories
        )