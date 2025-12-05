"""
Pydantic schemas for Setting management.
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SettingResponse(BaseModel):
    """Schema for Setting response."""
    key: str
    value: str | None
    value_type: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


class SettingsResponse(BaseModel):
    """Schema for multiple settings response."""
    settings: dict[str, str | int | float | bool | None]

