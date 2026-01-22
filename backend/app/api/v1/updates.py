"""
Application update API endpoints.
Provides endpoints for checking and managing POS app updates.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
import logging

from app.database import get_db
from app.models import ApplicationVersion, User
from app.schemas.application_version import (
    ApplicationVersionCreate, ApplicationVersionUpdate, ApplicationVersionResponse,
    UpdateCheckRequest, UpdateCheckResponse, UpdateNotificationRequest
)
from app.api.v1.auth import get_current_user
from app.services.update_notifier import notify_update_available

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/updates", tags=["updates"])


def compare_versions(version1: str, version2: str) -> int:
    """
    Compare two version strings.
    Returns: -1 if version1 < version2, 0 if equal, 1 if version1 > version2
    """
    def version_tuple(v: str) -> tuple:
        parts = v.split('.')
        return tuple(int(part) for part in parts)
    
    v1_tuple = version_tuple(version1)
    v2_tuple = version_tuple(version2)
    
    if v1_tuple < v2_tuple:
        return -1
    elif v1_tuple > v2_tuple:
        return 1
    return 0


@router.get("/latest", response_model=ApplicationVersionResponse)
async def get_latest_version(
    platform: str = Query(..., description="Platform: win32, darwin, or linux"),
    db: Session = Depends(get_db)
):
    """Get latest available version for a platform."""
    if platform not in ['win32', 'darwin', 'linux']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid platform. Must be 'win32', 'darwin', or 'linux'"
        )
    
    latest_version = db.query(ApplicationVersion).filter(
        ApplicationVersion.platform == platform,
        ApplicationVersion.is_active == True
    ).order_by(ApplicationVersion.release_date.desc()).first()
    
    if not latest_version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No active version found for platform '{platform}'"
        )
    
    return latest_version


@router.get("/check", response_model=UpdateCheckResponse)
async def check_for_updates(
    platform: str = Query(..., description="Platform: win32, darwin, or linux"),
    current_version: str = Query(..., description="Current application version"),
    db: Session = Depends(get_db)
):
    """Check if updates are available for the current version."""
    if platform not in ['win32', 'darwin', 'linux']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid platform. Must be 'win32', 'darwin', or 'linux'"
        )
    
    # Get latest version for platform
    latest_version = db.query(ApplicationVersion).filter(
        ApplicationVersion.platform == platform,
        ApplicationVersion.is_active == True
    ).order_by(ApplicationVersion.release_date.desc()).first()
    
    if not latest_version:
        return UpdateCheckResponse(update_available=False)
    
    # Compare versions
    if compare_versions(current_version, latest_version.version) < 0:
        # Update available
        return UpdateCheckResponse(
            update_available=True,
            version=latest_version.version,
            is_mandatory=latest_version.is_mandatory,
            release_notes=latest_version.release_notes,
            download_url=latest_version.download_url,
            file_size=latest_version.file_size,
            checksum=latest_version.checksum,
            release_date=latest_version.release_date
        )
    
    return UpdateCheckResponse(update_available=False)


@router.post("/notify", status_code=status.HTTP_200_OK)
async def notify_update_available_endpoint(
    request: UpdateNotificationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Manually trigger update notification via WebSocket."""
    # Verify version exists
    version = db.query(ApplicationVersion).filter(ApplicationVersion.id == request.version_id).first()
    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Version with ID {request.version_id} not found"
        )
    
    # Check permissions (admin/superuser only)
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can trigger update notifications"
        )
    
    # Notify via WebSocket
    try:
        await notify_update_available(
            version=version,
            notify_all=request.notify_all,
            cash_register_ids=request.cash_register_ids
        )
        return {"message": "Update notification sent successfully"}
    except Exception as e:
        logger.error(f"Error sending update notification: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send update notification: {str(e)}"
        )


# Admin endpoints for managing versions
@router.post("/admin/versions", response_model=ApplicationVersionResponse, status_code=status.HTTP_201_CREATED)
async def create_version(
    version_data: ApplicationVersionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new application version (admin only)."""
    # Check permissions (admin/superuser only)
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can create versions"
        )
    
    # Check if version already exists for this platform
    existing = db.query(ApplicationVersion).filter(
        ApplicationVersion.version == version_data.version,
        ApplicationVersion.platform == version_data.platform
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Version {version_data.version} already exists for platform {version_data.platform}"
        )
    
    # Create new version
    new_version = ApplicationVersion(**version_data.model_dump())
    db.add(new_version)
    db.commit()
    db.refresh(new_version)
    
    logger.info(f"Created new application version: {new_version.version} ({new_version.platform})")
    return new_version


@router.put("/admin/versions/{version_id}", response_model=ApplicationVersionResponse)
async def update_version(
    version_id: int,
    version_data: ApplicationVersionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update version information (admin only)."""
    # Check permissions (admin/superuser only)
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can update versions"
        )
    
    # Get version
    version = db.query(ApplicationVersion).filter(ApplicationVersion.id == version_id).first()
    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Version with ID {version_id} not found"
        )
    
    # Update fields
    update_data = version_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(version, field, value)
    
    db.commit()
    db.refresh(version)
    
    logger.info(f"Updated application version: {version.version} ({version.platform})")
    return version


@router.get("/admin/versions", response_model=List[ApplicationVersionResponse])
async def list_versions(
    platform: Optional[str] = Query(None, description="Filter by platform"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all application versions (admin only)."""
    # Check permissions (admin/superuser only)
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can list versions"
        )
    
    query = db.query(ApplicationVersion)
    
    if platform:
        query = query.filter(ApplicationVersion.platform == platform)
    
    if is_active is not None:
        query = query.filter(ApplicationVersion.is_active == is_active)
    
    versions = query.order_by(ApplicationVersion.release_date.desc()).all()
    return versions


@router.get("/admin/versions/{version_id}", response_model=ApplicationVersionResponse)
async def get_version(
    version_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific version (admin only)."""
    # Check permissions (admin/superuser only)
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can view versions"
        )
    
    version = db.query(ApplicationVersion).filter(ApplicationVersion.id == version_id).first()
    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Version with ID {version_id} not found"
        )
    
    return version

