"""Tests for menu sync data models."""

import pytest
from decimal import Decimal
from datetime import datetime
from pydantic import ValidationError

from src.menu_sync.models import (
    MenuItem, MenuCategory, Menu, MenuItemOption,
    SyncStatus, SyncResponse, MenuDiff
)


class TestMenuItem:
    """Tests for MenuItem model."""
    
    def test_create_valid_menu_item(self):
        """Test creating a valid menu item."""
        item = MenuItem(
            id="123",
            name="  Test Item  ",
            price=9.99,
            category="appetizers"
        )
        
        assert item.id == "123"
        assert item.name == "Test Item"  # Should be stripped
        assert item.price == Decimal("9.99")
        assert item.category == "Appetizers"  # Should be title case
        assert item.available is True  # Default value
        assert item.options == []
        assert isinstance(item.created_at, datetime)
    
    def test_menu_item_with_options(self):
        """Test menu item with options."""
        option = MenuItemOption(
            id="opt1",
            name="Extra Cheese",
            price=1.50,
            available=True
        )
        
        item = MenuItem(
            id="123",
            name="Pizza",
            price=15.99,
            category="Main",
            options=[option]
        )
        
        assert len(item.options) == 1
        assert item.options[0].name == "Extra Cheese"
        assert item.options[0].price == Decimal("1.50")
    
    def test_invalid_menu_item_validation(self):
        """Test validation errors for invalid menu items."""
        # Missing required fields
        with pytest.raises(ValidationError):
            MenuItem(name="Test")
        
        # Invalid price
        with pytest.raises(ValidationError):
            MenuItem(
                id="123",
                name="Test",
                price=-5.00,
                category="Main"
            )
        
        # Empty name
        with pytest.raises(ValidationError):
            MenuItem(
                id="123",
                name="",
                price=10.00,
                category="Main"
            )


class TestMenuCategory:
    """Tests for MenuCategory model."""
    
    def test_create_valid_category(self):
        """Test creating a valid menu category."""
        category = MenuCategory(
            id="cat1",
            name="appetizers",
            description="Starters and small plates",
            display_order=1
        )
        
        assert category.id == "cat1"
        assert category.name == "Appetizers"  # Should be title case
        assert category.description == "Starters and small plates"
        assert category.display_order == 1
        assert category.active is True
        assert category.items == []
    
    def test_category_with_items(self, sample_menu_item):
        """Test category with menu items."""
        category = MenuCategory(
            id="cat1",
            name="Sandwiches",
            items=[sample_menu_item]
        )
        
        assert len(category.items) == 1
        assert category.items[0].name == "Chicken Sandwich"


class TestMenu:
    """Tests for Menu model."""
    
    def test_create_valid_menu(self, sample_menu_category):
        """Test creating a valid menu."""
        menu = Menu(
            id="menu1",
            restaurant_id="rest1",
            name="  Lunch Menu  ",
            categories=[sample_menu_category]
        )
        
        assert menu.id == "menu1"
        assert menu.restaurant_id == "rest1"
        assert menu.name == "Lunch Menu"  # Should be stripped
        assert len(menu.categories) == 1
        assert menu.currency == "USD"  # Default
        assert menu.active is True
        assert menu.version == 1
    
    def test_invalid_currency(self):
        """Test invalid currency code."""
        with pytest.raises(ValidationError):
            Menu(
                id="menu1",
                restaurant_id="rest1",
                name="Menu",
                currency="US"  # Should be 3 letters
            )


class TestSyncStatus:
    """Tests for SyncStatus model."""
    
    def test_create_sync_status(self):
        """Test creating sync status."""
        status = SyncStatus(status="pending")
        
        assert status.status == "pending"
        assert status.items_processed == 0
        assert status.errors == []
        assert isinstance(status.started_at, datetime)
        assert status.completed_at is None
    
    def test_mark_completed(self):
        """Test marking sync as completed."""
        status = SyncStatus(status="in_progress")
        status.items_processed = 10
        status.mark_completed()
        
        assert status.status == "completed"
        assert status.completed_at is not None
        assert isinstance(status.completed_at, datetime)
    
    def test_add_error(self):
        """Test adding error to sync status."""
        status = SyncStatus(status="in_progress")
        status.add_error("Connection timeout")
        
        assert status.status == "failed"
        assert len(status.errors) == 1
        assert status.errors[0] == "Connection timeout"
    
    def test_invalid_status(self):
        """Test invalid status value."""
        with pytest.raises(ValidationError):
            SyncStatus(status="invalid")


class TestSyncResponse:
    """Tests for SyncResponse model."""
    
    def test_success_response(self, sample_menu):
        """Test successful sync response."""
        sync_status = SyncStatus(status="completed")
        response = SyncResponse(
            status="success",
            data=sample_menu,
            sync_status=sync_status
        )
        
        assert response.status == "success"
        assert response.data is not None
        assert response.data.name == "Main Menu"
        assert response.error is None
    
    def test_error_response(self):
        """Test error sync response."""
        response = SyncResponse(
            status="error",
            error="Authentication failed"
        )
        
        assert response.status == "error"
        assert response.data is None
        assert response.error == "Authentication failed"


class TestMenuDiff:
    """Tests for MenuDiff model."""
    
    def test_empty_diff(self):
        """Test empty menu diff."""
        diff = MenuDiff()
        
        assert diff.has_changes is False
        assert diff.added_items == []
        assert diff.updated_items == []
        assert diff.deleted_items == []
    
    def test_diff_with_changes(self, sample_menu_item):
        """Test menu diff with changes."""
        diff = MenuDiff(
            added_items=[sample_menu_item],
            updated_items=[],
            deleted_items=["item_456"]
        )
        
        assert diff.has_changes is True
        assert len(diff.added_items) == 1
        assert len(diff.deleted_items) == 1