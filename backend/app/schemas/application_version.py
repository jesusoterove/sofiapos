"""
Application version schemas for API requests and responses.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ApplicationVersionBase(BaseModel):
    """Base schema for application version."""
    version: str = Field(..., description="Version string (e.g., '1.0.1')")
    platform: str = Field(..., description="Platform: 'win32', 'darwin', or 'linux'")
    is_mandatory: bool = Field(default=False, description="Whether this update is mandatory")
    release_notes: Optional[str] = Field(None, description="Release notes")
    download_url: str = Field(..., description="URL to download the update file")
    file_size: Optional[int] = Field(None, description="File size in bytes")
    checksum: Optional[str] = Field(None, description="SHA-256 checksum of the file")
    is_active: bool = Field(default=True, description="Whether this version is active")


class ApplicationVersionCreate(ApplicationVersionBase):
    """Schema for creating a new application version."""
    pass


class ApplicationVersionUpdate(BaseModel):
    """Schema for updating an application version."""
    is_mandatory: Optional[bool] = None
    release_notes: Optional[str] = None
    download_url: Optional[str] = None
    file_size: Optional[int] = None
    checksum: Optional[str] = None
    is_active: Optional[bool] = None


class ApplicationVersionResponse(ApplicationVersionBase):
    """Schema for application version response."""
    id: int
    release_date: datetime
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UpdateCheckRequest(BaseModel):
    """Schema for update check request."""
    platform: str = Field(..., description="Platform: 'win32', 'darwin', or 'linux'")
    current_version: str = Field(..., description="Current application version")


class UpdateCheckResponse(BaseModel):
    """Schema for update check response."""
    update_available: bool
    version: Optional[str] = None
    is_mandatory: bool = False
    release_notes: Optional[str] = None
    download_url: Optional[str] = None
    file_size: Optional[int] = None
    checksum: Optional[str] = None
    release_date: Optional[datetime] = None


class UpdateNotificationRequest(BaseModel):
    """Schema for triggering update notification."""
    version_id: int = Field(..., description="Version ID to notify about")
    notify_all: bool = Field(default=False, description="Notify all connected clients")
    cash_register_ids: Optional[list[int]] = Field(None, description="Specific cash register IDs to notify")

