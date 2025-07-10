"""Pytest configuration and fixtures."""

import pytest
import asyncio
from typing import Generator
from unittest.mock import Mock, AsyncMock

from src.menu_sync.models import Menu, MenuItem, MenuCategory, MenuItemOption
from src.menu_sync.otter_client import OtterClient


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def sample_menu_item() -> MenuItem:
    """Create a sample menu item for testing."""
    return MenuItem(
        id="item_123",
        name="Chicken Sandwich",
        description="Grilled chicken with lettuce and tomato",
        price=12.99,
        category="Sandwiches",
        available=True,
        tags=["chicken", "sandwich"],
        options=[
            MenuItemOption(
                id="opt_1",
                name="Extra Cheese",
                price=1.50,
                available=True
            )
        ]
    )


@pytest.fixture
def sample_menu_category(sample_menu_item) -> MenuCategory:
    """Create a sample menu category for testing."""
    return MenuCategory(
        id="cat_123",
        name="Sandwiches",
        description="All our delicious sandwiches",
        display_order=1,
        items=[sample_menu_item],
        active=True
    )


@pytest.fixture
def sample_menu(sample_menu_category) -> Menu:
    """Create a sample menu for testing."""
    return Menu(
        id="menu_123",
        restaurant_id="rest_123",
        name="Main Menu",
        description="Our full menu",
        categories=[sample_menu_category],
        currency="USD",
        active=True,
        version=1
    )


@pytest.fixture
def mock_otter_client():
    """Create a mock OtterClient for testing."""
    client = Mock(spec=OtterClient)
    client.authenticate = AsyncMock(return_value=True)
    client.fetch_menu_data = AsyncMock()
    client.update_menu_item = AsyncMock(return_value=True)
    client.__aenter__ = AsyncMock(return_value=client)
    client.__aexit__ = AsyncMock(return_value=None)
    return client


@pytest.fixture
def mock_settings(monkeypatch):
    """Mock settings for testing."""
    monkeypatch.setattr("src.config.settings.settings.otter_username", "test@example.com")
    monkeypatch.setattr("src.config.settings.settings.otter_password", "test_password")
    monkeypatch.setattr("src.config.settings.settings.sync_interval_minutes", 30)
    monkeypatch.setattr("src.config.settings.settings.sync_enabled", True)
    monkeypatch.setattr("src.config.settings.settings.dry_run_mode", False)