"""Configuration settings for Otter menu sync."""

import os
from typing import Optional
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Profile Configuration
    active_profile: Optional[str] = Field(default=None, alias="OTTER_PROFILE")
    
    # Otter API Configuration - uses standard OTTER_ prefix (fallback if no profile)
    otter_username: Optional[str] = Field(default=None, alias="OTTER_USERNAME")
    otter_password: Optional[str] = Field(default=None, alias="OTTER_PASSWORD")
    otter_base_url: str = Field(default="https://api.tryotter.com", alias="OTTER_BASE_URL")
    
    # Database Configuration (optional)
    database_url: Optional[str] = Field(default=None, alias="DATABASE_URL")
    
    # Sync Configuration - uses MENU_SYNC_ prefix for sync-specific settings
    sync_interval_minutes: int = Field(default=30, alias="MENU_SYNC_INTERVAL_MINUTES")
    sync_enabled: bool = Field(default=True, alias="MENU_SYNC_ENABLED")
    sync_all_profiles: bool = Field(default=False, alias="MENU_SYNC_ALL_PROFILES")
    
    # Logging Configuration
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    log_file: Optional[str] = Field(default="logs/menu_sync.log", alias="LOG_FILE")
    
    # Feature Flags
    dry_run_mode: bool = Field(default=False, alias="MENU_SYNC_DRY_RUN")
    
    class Config:
        """Pydantic config."""
        case_sensitive = False
        populate_by_name = True
    
    def get_current_credentials(self) -> tuple[str, str, str]:
        """Get current credentials from profile or environment."""
        if self.active_profile:
            from src.config.profiles import profile_manager
            profile = profile_manager.get_profile(self.active_profile)
            if profile:
                return profile.username, profile.password, profile.base_url
        
        # Fallback to environment variables
        if not self.otter_username or not self.otter_password:
            raise ValueError("No Otter credentials found. Set OTTER_PROFILE or OTTER_USERNAME/OTTER_PASSWORD")
        
        return self.otter_username, self.otter_password, self.otter_base_url


settings = Settings()