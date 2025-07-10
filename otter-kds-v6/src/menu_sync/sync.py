"""Core menu synchronization logic."""

import asyncio
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any

from src.config.settings import settings
from src.menu_sync.models import (
    Menu, MenuItem, MenuCategory, SyncStatus, SyncResponse, MenuDiff
)
from src.menu_sync.otter_client import OtterClient
from src.utils.retry import retry

logger = logging.getLogger(__name__)


class MenuSyncService:
    """Service for synchronizing Otter menu data."""
    
    def __init__(self, profile_name: Optional[str] = None):
        """Initialize menu sync service.
        
        Args:
            profile_name: Optional profile name to use
        """
        self.profile_name = profile_name
        self.client = OtterClient(profile_name)
        self.current_menu: Optional[Menu] = None
        self.sync_status: Optional[SyncStatus] = None
    
    async def sync_menu(self, restaurant_id: Optional[str] = None) -> SyncResponse:
        """
        Main sync function to fetch and process menu data.
        
        Args:
            restaurant_id: Optional restaurant ID to sync specific menu
            
        Returns:
            SyncResponse with status and data
        """
        self.sync_status = SyncStatus(status="in_progress")
        
        try:
            # Authenticate with Otter
            async with self.client as client:
                auth_success = await client.authenticate()
                if not auth_success:
                    self.sync_status.add_error("Authentication failed")
                    return SyncResponse(
                        status="error",
                        error="Failed to authenticate with Otter",
                        sync_status=self.sync_status
                    )
                
                # Fetch menu data
                logger.info("Fetching menu data from Otter")
                new_menu = await self._fetch_menu_with_retry(client, restaurant_id)
                
                if not new_menu:
                    self.sync_status.add_error("Failed to fetch menu data")
                    return SyncResponse(
                        status="error",
                        error="Failed to fetch menu data",
                        sync_status=self.sync_status
                    )
                
                # Process menu differences
                if self.current_menu:
                    menu_diff = self._calculate_menu_diff(self.current_menu, new_menu)
                    await self._process_menu_changes(menu_diff)
                else:
                    # First sync - all items are new
                    self.sync_status.items_created = sum(
                        len(cat.items) for cat in new_menu.categories
                    )
                
                # Update current menu
                self.current_menu = new_menu
                self.sync_status.items_processed = sum(
                    len(cat.items) for cat in new_menu.categories
                )
                
                # Mark sync as completed
                self.sync_status.mark_completed()
                
                logger.info(
                    f"Menu sync completed. Processed: {self.sync_status.items_processed}, "
                    f"Created: {self.sync_status.items_created}, "
                    f"Updated: {self.sync_status.items_updated}"
                )
                
                return SyncResponse(
                    status="success",
                    data=new_menu,
                    sync_status=self.sync_status
                )
                
        except Exception as e:
            logger.error(f"Menu sync failed: {e}")
            self.sync_status.add_error(str(e))
            return SyncResponse(
                status="error",
                error=str(e),
                sync_status=self.sync_status
            )
    
    @retry(attempts=3, delay=1.0)
    async def _fetch_menu_with_retry(
        self, 
        client: OtterClient, 
        restaurant_id: Optional[str] = None
    ) -> Optional[Menu]:
        """
        Fetch menu data with retry logic.
        
        Args:
            client: OtterClient instance
            restaurant_id: Optional restaurant ID
            
        Returns:
            Menu object or None
        """
        return await client.fetch_menu_data(restaurant_id)
    
    def _calculate_menu_diff(self, old_menu: Menu, new_menu: Menu) -> MenuDiff:
        """
        Calculate differences between old and new menu.
        
        Args:
            old_menu: Previous menu state
            new_menu: New menu state
            
        Returns:
            MenuDiff object with changes
        """
        diff = MenuDiff()
        
        # Create lookup maps
        old_items_map = {}
        new_items_map = {}
        
        for cat in old_menu.categories:
            for item in cat.items:
                old_items_map[item.id] = item
        
        for cat in new_menu.categories:
            for item in cat.items:
                new_items_map[item.id] = item
        
        # Find added and updated items
        for item_id, new_item in new_items_map.items():
            if item_id not in old_items_map:
                diff.added_items.append(new_item)
            else:
                old_item = old_items_map[item_id]
                if self._item_has_changed(old_item, new_item):
                    diff.updated_items.append(new_item)
        
        # Find deleted items
        for item_id in old_items_map:
            if item_id not in new_items_map:
                diff.deleted_items.append(item_id)
        
        return diff
    
    def _item_has_changed(self, old_item: MenuItem, new_item: MenuItem) -> bool:
        """
        Check if a menu item has changed.
        
        Args:
            old_item: Previous item state
            new_item: New item state
            
        Returns:
            bool: True if item has changed
        """
        # Compare relevant fields
        fields_to_compare = ['name', 'description', 'price', 'category', 'available']
        
        for field in fields_to_compare:
            if getattr(old_item, field) != getattr(new_item, field):
                return True
        
        return False
    
    async def _process_menu_changes(self, diff: MenuDiff) -> None:
        """
        Process menu changes (e.g., update database, send notifications).
        
        Args:
            diff: MenuDiff object with changes
        """
        if not diff.has_changes:
            logger.info("No menu changes detected")
            return
        
        # Update sync status counters
        self.sync_status.items_created = len(diff.added_items)
        self.sync_status.items_updated = len(diff.updated_items)
        self.sync_status.items_deleted = len(diff.deleted_items)
        
        # Log changes
        if diff.added_items:
            logger.info(f"Added {len(diff.added_items)} new menu items")
        if diff.updated_items:
            logger.info(f"Updated {len(diff.updated_items)} menu items")
        if diff.deleted_items:
            logger.info(f"Deleted {len(diff.deleted_items)} menu items")
        
        # Here you would typically:
        # 1. Update database
        # 2. Send notifications
        # 3. Update external systems
        
        if settings.dry_run_mode:
            logger.info("Dry run mode - no changes applied")
        else:
            # Apply changes (placeholder for actual implementation)
            pass


async def run_sync_scheduler():
    """Run periodic menu sync based on configured interval."""
    if settings.sync_all_profiles:
        # Sync all profiles
        from src.config.profiles import profile_manager
        profiles = profile_manager.list_profiles()
        
        if not profiles:
            logger.error("No profiles configured for sync")
            return
            
        while settings.sync_enabled:
            logger.info(f"Starting scheduled sync for {len(profiles)} profiles")
            
            for profile_name in profiles:
                try:
                    logger.info(f"Syncing profile: {profile_name}")
                    sync_service = MenuSyncService(profile_name)
                    result = await sync_service.sync_menu()
                    
                    if result.status == "error":
                        logger.error(f"Sync failed for {profile_name}: {result.error}")
                except Exception as e:
                    logger.error(f"Unexpected error syncing {profile_name}: {e}")
            
            # Wait for next sync interval
            await asyncio.sleep(settings.sync_interval_minutes * 60)
    else:
        # Single profile sync
        sync_service = MenuSyncService()
        
        while settings.sync_enabled:
            logger.info("Starting scheduled menu sync")
            
            try:
                result = await sync_service.sync_menu()
                
                if result.status == "error":
                    logger.error(f"Sync failed: {result.error}")
                
            except Exception as e:
                logger.error(f"Unexpected error in sync scheduler: {e}")
            
            # Wait for next sync interval
            await asyncio.sleep(settings.sync_interval_minutes * 60)


def start_sync_service():
    """Start the menu sync service."""
    logger.info(
        f"Starting menu sync service (interval: {settings.sync_interval_minutes} minutes)"
    )
    asyncio.run(run_sync_scheduler())