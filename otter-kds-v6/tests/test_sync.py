"""Tests for menu synchronization service."""

import pytest
from unittest.mock import Mock, AsyncMock, patch

from src.menu_sync.sync import MenuSyncService
from src.menu_sync.models import Menu, MenuItem, MenuCategory, SyncStatus, MenuDiff


class TestMenuSyncService:
    """Tests for MenuSyncService."""
    
    @pytest.mark.asyncio
    async def test_successful_sync(self, mock_otter_client, sample_menu, mock_settings):
        """Test successful menu synchronization."""
        # Setup
        mock_otter_client.fetch_menu_data.return_value = sample_menu
        
        with patch('src.menu_sync.sync.OtterClient', return_value=mock_otter_client):
            service = MenuSyncService()
            result = await service.sync_menu()
        
        # Verify
        assert result.status == "success"
        assert result.data is not None
        assert result.data.name == "Main Menu"
        assert result.sync_status.status == "completed"
        assert result.sync_status.items_processed == 1
        assert result.sync_status.items_created == 1  # First sync
        
        # Verify client methods called
        mock_otter_client.authenticate.assert_called_once()
        mock_otter_client.fetch_menu_data.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_authentication_failure(self, mock_otter_client, mock_settings):
        """Test handling authentication failure."""
        # Setup
        mock_otter_client.authenticate.return_value = False
        
        with patch('src.menu_sync.sync.OtterClient', return_value=mock_otter_client):
            service = MenuSyncService()
            result = await service.sync_menu()
        
        # Verify
        assert result.status == "error"
        assert result.error == "Failed to authenticate with Otter"
        assert result.sync_status.status == "failed"
        assert "Authentication failed" in result.sync_status.errors
    
    @pytest.mark.asyncio
    async def test_fetch_menu_failure(self, mock_otter_client, mock_settings):
        """Test handling menu fetch failure."""
        # Setup
        mock_otter_client.fetch_menu_data.return_value = None
        
        with patch('src.menu_sync.sync.OtterClient', return_value=mock_otter_client):
            service = MenuSyncService()
            result = await service.sync_menu()
        
        # Verify
        assert result.status == "error"
        assert result.error == "Failed to fetch menu data"
        assert result.sync_status.status == "failed"
    
    @pytest.mark.asyncio
    async def test_menu_diff_calculation(self, sample_menu):
        """Test menu difference calculation."""
        service = MenuSyncService()
        
        # Create old menu
        old_item = MenuItem(
            id="item_123",
            name="Old Sandwich",
            price=10.99,
            category="Sandwiches"
        )
        old_category = MenuCategory(
            id="cat_123",
            name="Sandwiches",
            items=[old_item]
        )
        old_menu = Menu(
            id="menu_123",
            restaurant_id="rest_123",
            name="Main Menu",
            categories=[old_category]
        )
        
        # Calculate diff
        diff = service._calculate_menu_diff(old_menu, sample_menu)
        
        # Verify changes detected
        assert diff.has_changes
        assert len(diff.updated_items) == 1
        assert diff.updated_items[0].name == "Chicken Sandwich"
        assert diff.updated_items[0].price == 12.99
    
    def test_item_change_detection(self):
        """Test detecting changes in menu items."""
        service = MenuSyncService()
        
        old_item = MenuItem(
            id="123",
            name="Test Item",
            price=10.00,
            category="Main"
        )
        
        # Same item
        same_item = MenuItem(
            id="123",
            name="Test Item",
            price=10.00,
            category="Main"
        )
        assert not service._item_has_changed(old_item, same_item)
        
        # Changed price
        changed_price = MenuItem(
            id="123",
            name="Test Item",
            price=12.00,
            category="Main"
        )
        assert service._item_has_changed(old_item, changed_price)
        
        # Changed name
        changed_name = MenuItem(
            id="123",
            name="Updated Item",
            price=10.00,
            category="Main"
        )
        assert service._item_has_changed(old_item, changed_name)
    
    @pytest.mark.asyncio
    async def test_dry_run_mode(self, mock_otter_client, sample_menu, mock_settings):
        """Test sync in dry-run mode."""
        # Setup
        mock_otter_client.fetch_menu_data.return_value = sample_menu
        
        with patch('src.menu_sync.sync.OtterClient', return_value=mock_otter_client):
            with patch('src.config.settings.settings.dry_run_mode', True):
                service = MenuSyncService()
                
                # Set current menu to trigger diff
                service.current_menu = sample_menu
                
                result = await service.sync_menu()
        
        # Verify
        assert result.status == "success"
        assert result.sync_status.status == "completed"
        # In dry-run mode, changes should be detected but not applied
    
    @pytest.mark.asyncio
    async def test_exception_handling(self, mock_otter_client, mock_settings):
        """Test exception handling during sync."""
        # Setup
        mock_otter_client.authenticate.side_effect = Exception("Network error")
        
        with patch('src.menu_sync.sync.OtterClient', return_value=mock_otter_client):
            service = MenuSyncService()
            result = await service.sync_menu()
        
        # Verify
        assert result.status == "error"
        assert "Network error" in result.error
        assert result.sync_status.status == "failed"
        assert len(result.sync_status.errors) > 0