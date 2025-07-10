"""Otter API client for menu synchronization."""

import logging
from typing import Optional, Dict, Any, List
import httpx
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options as ChromeOptions

from src.config.settings import settings
from src.menu_sync.models import Menu, MenuItem, MenuCategory

logger = logging.getLogger(__name__)


class OtterClient:
    """Client for interacting with Otter API."""
    
    def __init__(self, profile_name: Optional[str] = None):
        """Initialize Otter client.
        
        Args:
            profile_name: Optional profile name to use. If None, uses settings.
        """
        if profile_name:
            from src.config.profiles import profile_manager
            profile = profile_manager.get_profile(profile_name)
            if not profile:
                raise ValueError(f"Profile '{profile_name}' not found")
            self.username = profile.username
            self.password = profile.password
            self.base_url = profile.base_url
        else:
            # Use settings which handles profile or env vars
            self.username, self.password, self.base_url = settings.get_current_credentials()
        
        self.session_token: Optional[str] = None
        self._client: Optional[httpx.AsyncClient] = None
    
    async def __aenter__(self):
        """Async context manager entry."""
        self._client = httpx.AsyncClient(
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            },
            timeout=30.0
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        if self._client:
            await self._client.aclose()
    
    async def authenticate(self) -> bool:
        """
        Authenticate with Otter using Selenium for web-based login.
        
        Returns:
            bool: True if authentication successful
        """
        try:
            logger.info("Starting Otter authentication")
            
            # Configure Chrome options
            options = ChromeOptions()
            options.add_argument('--headless')
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')
            
            driver = webdriver.Chrome(options=options)
            wait = WebDriverWait(driver, 20)
            
            try:
                # Navigate to login page
                driver.get("https://app.tryotter.com/login")
                
                # Enter credentials
                email_field = wait.until(
                    EC.presence_of_element_located((By.NAME, "email"))
                )
                email_field.send_keys(self.username)
                
                password_field = driver.find_element(By.NAME, "password")
                password_field.send_keys(self.password)
                
                # Click login button
                login_button = driver.find_element(
                    By.CSS_SELECTOR, "button[type='submit']"
                )
                login_button.click()
                
                # Wait for successful login
                wait.until(
                    EC.presence_of_element_located((By.CLASS_NAME, "dashboard"))
                )
                
                # Extract session token from cookies
                cookies = driver.get_cookies()
                for cookie in cookies:
                    if cookie['name'] == 'session_token':
                        self.session_token = cookie['value']
                        break
                
                if self.session_token:
                    logger.info("Authentication successful")
                    return True
                else:
                    logger.error("Session token not found")
                    return False
                    
            finally:
                driver.quit()
                
        except Exception as e:
            logger.error(f"Authentication failed: {e}")
            return False
    
    async def fetch_menu_data(self, restaurant_id: Optional[str] = None) -> Optional[Menu]:
        """
        Fetch menu data from Otter API.
        
        Args:
            restaurant_id: Optional restaurant ID to fetch specific menu
            
        Returns:
            Menu object or None if error
        """
        if not self.session_token:
            logger.error("Not authenticated")
            return None
        
        try:
            # This is a mock implementation - replace with actual API endpoint
            url = f"{self.base_url}/api/v1/menus"
            if restaurant_id:
                url += f"/{restaurant_id}"
            
            headers = {
                "Authorization": f"Bearer {self.session_token}",
                "Content-Type": "application/json"
            }
            
            response = await self._client.get(url, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            return self._parse_menu_data(data)
            
        except Exception as e:
            logger.error(f"Failed to fetch menu data: {e}")
            return None
    
    def _parse_menu_data(self, data: Dict[str, Any]) -> Menu:
        """
        Parse raw API data into Menu model.
        
        Args:
            data: Raw API response data
            
        Returns:
            Parsed Menu object
        """
        categories = []
        
        for cat_data in data.get('categories', []):
            items = []
            
            for item_data in cat_data.get('items', []):
                item = MenuItem(
                    id=item_data['id'],
                    name=item_data['name'],
                    description=item_data.get('description'),
                    price=item_data['price'],
                    category=cat_data['name'],
                    available=item_data.get('available', True),
                    options=[],  # Would parse options here
                    images=item_data.get('images', []),
                    tags=item_data.get('tags', [])
                )
                items.append(item)
            
            category = MenuCategory(
                id=cat_data['id'],
                name=cat_data['name'],
                description=cat_data.get('description'),
                display_order=cat_data.get('order', 0),
                items=items
            )
            categories.append(category)
        
        menu = Menu(
            id=data['id'],
            restaurant_id=data['restaurant_id'],
            name=data['name'],
            description=data.get('description'),
            categories=categories,
            currency=data.get('currency', 'USD')
        )
        
        return menu
    
    async def update_menu_item(self, item: MenuItem) -> bool:
        """
        Update a menu item in Otter.
        
        Args:
            item: MenuItem to update
            
        Returns:
            bool: True if successful
        """
        if not self.session_token:
            logger.error("Not authenticated")
            return False
        
        try:
            url = f"{self.base_url}/api/v1/menu-items/{item.id}"
            headers = {
                "Authorization": f"Bearer {self.session_token}",
                "Content-Type": "application/json"
            }
            
            data = item.model_dump(exclude={'created_at', 'updated_at'})
            response = await self._client.put(url, headers=headers, json=data)
            response.raise_for_status()
            
            logger.info(f"Successfully updated menu item: {item.name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to update menu item {item.id}: {e}")
            return False