"""Account profiles management for multiple Otter accounts."""

import os
import json
from pathlib import Path
from typing import Dict, Optional, List
from pydantic import BaseModel, Field


class OtterProfile(BaseModel):
    """Model for an Otter account profile."""
    
    name: str = Field(..., description="Profile name")
    username: str = Field(..., description="Otter username/email")
    password: str = Field(..., description="Otter password")
    base_url: str = Field(default="https://api.tryotter.com", description="Otter API URL")
    restaurant_ids: Optional[List[str]] = Field(default=None, description="Specific restaurant IDs for this account")
    description: Optional[str] = Field(default=None, description="Profile description")


class ProfileManager:
    """Manages multiple Otter account profiles."""
    
    def __init__(self, profiles_file: str = "profiles.json"):
        """Initialize profile manager."""
        self.profiles_file = Path(profiles_file)
        self.profiles: Dict[str, OtterProfile] = {}
        self.load_profiles()
    
    def load_profiles(self) -> None:
        """Load profiles from JSON file."""
        if self.profiles_file.exists():
            try:
                with open(self.profiles_file, 'r') as f:
                    data = json.load(f)
                    for name, profile_data in data.items():
                        self.profiles[name] = OtterProfile(**profile_data, name=name)
            except Exception as e:
                print(f"Error loading profiles: {e}")
        else:
            # Check for environment variables as default profile
            if os.getenv("OTTER_USERNAME") and os.getenv("OTTER_PASSWORD"):
                self.profiles["default"] = OtterProfile(
                    name="default",
                    username=os.getenv("OTTER_USERNAME"),
                    password=os.getenv("OTTER_PASSWORD"),
                    base_url=os.getenv("OTTER_BASE_URL", "https://api.tryotter.com")
                )
    
    def save_profiles(self) -> None:
        """Save profiles to JSON file."""
        data = {
            name: profile.model_dump(exclude={"name"})
            for name, profile in self.profiles.items()
        }
        with open(self.profiles_file, 'w') as f:
            json.dump(data, f, indent=2)
    
    def add_profile(self, profile: OtterProfile) -> None:
        """Add a new profile."""
        self.profiles[profile.name] = profile
        self.save_profiles()
    
    def get_profile(self, name: str) -> Optional[OtterProfile]:
        """Get a profile by name."""
        return self.profiles.get(name)
    
    def list_profiles(self) -> List[str]:
        """List all profile names."""
        return list(self.profiles.keys())
    
    def remove_profile(self, name: str) -> bool:
        """Remove a profile."""
        if name in self.profiles:
            del self.profiles[name]
            self.save_profiles()
            return True
        return False
    
    def get_default_profile(self) -> Optional[OtterProfile]:
        """Get the default profile."""
        # First check for explicitly named 'default'
        if "default" in self.profiles:
            return self.profiles["default"]
        # If only one profile exists, use it
        if len(self.profiles) == 1:
            return list(self.profiles.values())[0]
        return None


# Global profile manager instance
profile_manager = ProfileManager()