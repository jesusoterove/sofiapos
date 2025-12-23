"""
Inventory entries API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import List, Optional, Union, Any
from datetime import datetime

from app.database import get_db
from app.models import InventoryEntry, InventoryTransaction, Store, Shift, User
from app.schemas.inventory import (
    InventoryEntryCreate, InventoryEntryUpdate, InventoryEntryResponse,
    InventoryTransactionCreate, InventoryTransactionResponse
)
from app.api.v1.auth import get_current_user

router = APIRouter(prefix="/inventory-entries", tags=["inventory-entries"])


@router.post("", response_model=InventoryEntryResponse, status_code=status.HTTP_201_CREATED)
async def create_inventory_entry(
    entry_data: Union[InventoryEntryCreate, dict] = Body(...),  # Accept both Pydantic model and dict
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new inventory entry.
    Accepts entry_number if provided, otherwise uses the one from the data.
    Handles both Pydantic schema (from frontend) and dict (from sync).
    """
    # Parse entry_data - handle both dict (from sync) and Pydantic model
    if isinstance(entry_data, dict):
        # Handle dict from sync (flexible field names)
        store_id = entry_data.get('store_id')
        vendor_id = entry_data.get('vendor_id')
        entry_number = entry_data.get('entry_number')
        entry_type = entry_data.get('entry_type')
        entry_date = entry_data.get('entry_date')
        notes = entry_data.get('notes')
        created_by_user_id = entry_data.get('created_by_user_id')
        shift_id = entry_data.get('shift_id')
        shift_number = entry_data.get('shift_number')
    else:
        # Handle Pydantic model
        store_id = entry_data.store_id
        vendor_id = entry_data.vendor_id
        entry_number = entry_data.entry_number
        entry_type = entry_data.entry_type
        entry_date = entry_data.entry_date
        notes = entry_data.notes
        created_by_user_id = entry_data.created_by_user_id
        shift_id = entry_data.shift_id
        shift_number = entry_data.shift_number
    
    # Verify store exists
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Store with ID {store_id} not found"
        )
    
    # Check if user has access to this store
    if not current_user.is_superuser and current_user.store_id != store_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this store"
        )
    
    # Note: shift_id and shift_number are not stored in InventoryEntry model
    # They are only used for reference in the frontend
    # If shift validation is needed in the future, it can be added here
    
    # If entry_number not provided, use the one from data (should always be present from sync)
    if not entry_number:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="entry_number is required"
        )
    
    # Check if entry_number already exists
    existing_entry = db.query(InventoryEntry).filter(
        InventoryEntry.entry_number == entry_number
    ).first()
    if existing_entry:
        # Return existing entry (idempotent)
        return existing_entry
    
    # Parse entry_date if it's a string
    if isinstance(entry_date, str):
        try:
            entry_date = datetime.fromisoformat(entry_date.replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            entry_date = datetime.utcnow()
    elif entry_date is None:
        entry_date = datetime.utcnow()
    
    # Create inventory entry
    inventory_entry = InventoryEntry(
        store_id=store_id,
        vendor_id=vendor_id,
        entry_number=entry_number,
        entry_type=entry_type,
        entry_date=entry_date,
        notes=notes,
        created_by_user_id=created_by_user_id or current_user.id,
    )
    
    db.add(inventory_entry)
    db.commit()
    db.refresh(inventory_entry)
    
    return inventory_entry


@router.get("", response_model=List[InventoryEntryResponse])
async def list_inventory_entries(
    store_id: Optional[int] = None,
    shift_id: Optional[int] = None,
    entry_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List inventory entries.
    """
    query = db.query(InventoryEntry)
    
    if store_id:
        # Check if user has access to this store
        if not current_user.is_superuser and current_user.store_id != store_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this store"
            )
        query = query.filter(InventoryEntry.store_id == store_id)
    elif not current_user.is_superuser:
        # Non-superusers can only see entries from their store
        query = query.filter(InventoryEntry.store_id == current_user.store_id)
    
    if shift_id:
        query = query.filter(InventoryEntry.shift_id == shift_id)
    
    if entry_type:
        query = query.filter(InventoryEntry.entry_type == entry_type)
    
    entries = query.order_by(InventoryEntry.entry_date.desc()).all()
    return entries


@router.get("/{entry_id}", response_model=InventoryEntryResponse)
async def get_inventory_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific inventory entry by ID.
    """
    entry = db.query(InventoryEntry).filter(InventoryEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inventory entry with ID {entry_id} not found"
        )
    
    # Check if user has access to this entry's store
    if not current_user.is_superuser and current_user.store_id != entry.store_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this inventory entry"
        )
    
    return entry


@router.put("/{entry_id}", response_model=InventoryEntryResponse)
async def update_inventory_entry(
    entry_id: int,
    entry_data: Union[InventoryEntryUpdate, dict] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update an inventory entry.
    """
    entry = db.query(InventoryEntry).filter(InventoryEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inventory entry with ID {entry_id} not found"
        )
    
    # Check if user has access to this entry's store
    if not current_user.is_superuser and current_user.store_id != entry.store_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this inventory entry"
        )
    
    # Parse entry_data - handle both dict and Pydantic model
    if isinstance(entry_data, dict):
        if 'vendor_id' in entry_data:
            entry.vendor_id = entry_data.get('vendor_id')
        if 'entry_type' in entry_data:
            entry.entry_type = entry_data.get('entry_type')
        if 'entry_date' in entry_data:
            entry_date = entry_data.get('entry_date')
            if isinstance(entry_date, str):
                try:
                    entry.entry_date = datetime.fromisoformat(entry_date.replace('Z', '+00:00'))
                except (ValueError, AttributeError):
                    pass
            else:
                entry.entry_date = entry_date
        if 'notes' in entry_data:
            entry.notes = entry_data.get('notes')
    else:
        if entry_data.vendor_id is not None:
            entry.vendor_id = entry_data.vendor_id
        if entry_data.entry_type is not None:
            entry.entry_type = entry_data.entry_type
        if entry_data.entry_date is not None:
            entry.entry_date = entry_data.entry_date
        if entry_data.notes is not None:
            entry.notes = entry_data.notes
    
    db.commit()
    db.refresh(entry)
    
    return entry

