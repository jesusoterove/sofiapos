"""
Settings API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.database import get_db
from app.models import Setting, User
from app.schemas.setting import SettingResponse, SettingsResponse
from app.api.v1.auth import get_current_user

router = APIRouter(prefix="/settings", tags=["settings"])


def get_setting_value(setting: Setting) -> Any:
    """Convert setting value to appropriate type based on value_type."""
    if not setting.value:
        return None
    
    if setting.value_type == "integer":
        return int(setting.value)
    elif setting.value_type == "float":
        return float(setting.value)
    elif setting.value_type == "boolean":
        return setting.value.lower() in ("true", "1", "yes")
    elif setting.value_type == "json":
        import json
        return json.loads(setting.value)
    else:
        return setting.value


@router.get("/global", response_model=SettingsResponse)
async def get_global_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all global settings (store_id is None)."""
    settings = db.query(Setting).filter(Setting.store_id == None).all()
    
    result: Dict[str, Any] = {}
    for setting in settings:
        result[setting.key] = get_setting_value(setting)
    
    return SettingsResponse(settings=result)


@router.get("/global/{key}", response_model=SettingResponse)
async def get_global_setting(
    key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific global setting by key."""
    setting = db.query(Setting).filter(
        Setting.key == key,
        Setting.store_id == None
    ).first()
    
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Setting '{key}' not found"
        )
    
    return SettingResponse(
        key=setting.key,
        value=setting.value,
        value_type=setting.value_type,
        description=setting.description
    )

