"""
Application configuration using Pydantic Settings.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class DefaultAdminSettings(BaseSettings):
    """Settings for default admin user creation."""
    
    model_config = SettingsConfigDict(
        env_prefix="DEFAULT_ADMIN_",
        case_sensitive=False,
        env_file=".env",
        env_file_encoding="utf-8",
    )
    
    username: str = "admin"
    password: str = "admin"
    email: str = "admin@sofiapos.local"
    full_name: Optional[str] = "Administrator"
    create_if_not_exists: bool = True


# Create settings instance
default_admin_settings = DefaultAdminSettings()

