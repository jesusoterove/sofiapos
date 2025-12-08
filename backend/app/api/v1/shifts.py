"""
Shift management API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models import Shift, ShiftUser, Store, User
from app.schemas.shift import (
    ShiftOpenRequest, ShiftResponse, ShiftUpdate, ShiftCloseRequest
)
from app.api.v1.auth import get_current_user

router = APIRouter(prefix="/shifts", tags=["shifts"])


def generate_shift_number(db: Session, store_id: int) -> str:
    """
    Generate a unique shift number for a store.
    Format: STORE-CODE-YYYYMMDD-XXX (e.g., STORE1-20240115-001)
    If store code is not available, uses store ID.
    """
    # Get store code
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Store with ID {store_id} not found"
        )
    
    # Use store code if available, otherwise use store ID
    store_code = (store.code or f"STORE{store_id}").upper().replace(" ", "-")
    today = datetime.now().strftime("%Y%m%d")
    
    # Count shifts for this store today
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    shift_count = db.query(func.count(Shift.id)).filter(
        Shift.store_id == store_id,
        Shift.opened_at >= today_start
    ).scalar() or 0
    
    # Generate shift number
    shift_number = f"{store_code}-{today}-{str(shift_count + 1).zfill(3)}"
    
    return shift_number


@router.get("/open", response_model=Optional[ShiftResponse])
async def get_open_shift(
    store_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get the currently open shift for a store.
    Returns null if no open shift exists (for offline-first compatibility).
    """
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
    
    # Find open shift for this store
    open_shift = db.query(Shift).filter(
        Shift.store_id == store_id,
        Shift.status == "open"
    ).first()
    
    # Return null if no open shift (instead of 404) for offline-first compatibility
    return open_shift


@router.post("/open", response_model=ShiftResponse, status_code=status.HTTP_201_CREATED)
async def open_shift(
    shift_data: ShiftOpenRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Open a new shift for a store.
    Requires initial cash amount and optionally inventory balance.
    """
    # Verify store exists
    store = db.query(Store).filter(Store.id == shift_data.store_id).first()
    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Store with ID {shift_data.store_id} not found"
        )
    
    # Check if user has access to this store
    if not current_user.is_superuser and current_user.store_id != shift_data.store_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this store"
        )
    
    # Check if there's already an open shift for this store
    existing_open_shift = db.query(Shift).filter(
        Shift.store_id == shift_data.store_id,
        Shift.status == "open"
    ).first()
    
    if existing_open_shift:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A shift is already open for this store (Shift #{existing_open_shift.shift_number})"
        )
    
    # Check if inventory balance is required
    if store.requires_start_inventory and shift_data.inventory_balance is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inventory beginning balance is required for this store"
        )
    
    # Generate shift number
    shift_number = generate_shift_number(db, shift_data.store_id)
    
    # Build notes with initial cash and inventory balance
    notes_parts = []
    if shift_data.initial_cash:
        notes_parts.append(f"Initial cash: {shift_data.initial_cash}")
    if shift_data.inventory_balance is not None:
        notes_parts.append(f"Initial inventory balance: {shift_data.inventory_balance}")
    notes = "\n".join(notes_parts) if notes_parts else None
    
    # Create new shift
    new_shift = Shift(
        store_id=shift_data.store_id,
        shift_number=shift_number,
        status="open",
        opened_by_user_id=current_user.id,
        notes=notes
    )
    
    db.add(new_shift)
    db.flush()  # Flush to get the ID
    
    # Add current user to shift
    shift_user = ShiftUser(
        shift_id=new_shift.id,
        user_id=current_user.id
    )
    db.add(shift_user)
    
    db.commit()
    db.refresh(new_shift)
    
    # TODO: Create cash register history entry with initial_cash
    # This would require cash_register_id, which might need to be passed or determined
    # For now, we store the initial cash in the shift notes
    # In a full implementation, you would:
    # 1. Get or create a cash register for the store
    # 2. Create a CashRegisterHistory entry with opening_balance = initial_cash
    # 3. Link the cash register history to the shift
    
    return new_shift


@router.get("", response_model=List[ShiftResponse])
async def list_shifts(
    store_id: Optional[int] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List shifts with optional filtering by store and status.
    """
    query = db.query(Shift)
    
    # Filter by store
    if store_id:
        # Check access
        if not current_user.is_superuser and current_user.store_id != store_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this store"
            )
        query = query.filter(Shift.store_id == store_id)
    elif not current_user.is_superuser:
        # Non-superusers can only see their store's shifts
        if current_user.store_id:
            query = query.filter(Shift.store_id == current_user.store_id)
        else:
            # User has no store assigned, return empty
            return []
    
    # Filter by status
    if status:
        query = query.filter(Shift.status == status)
    
    shifts = query.order_by(Shift.opened_at.desc()).offset(skip).limit(limit).all()
    return shifts


@router.get("/{shift_id}", response_model=ShiftResponse)
async def get_shift(
    shift_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific shift by ID.
    """
    shift = db.query(Shift).filter(Shift.id == shift_id).first()
    if not shift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Shift with ID {shift_id} not found"
        )
    
    # Check access
    if not current_user.is_superuser and current_user.store_id != shift.store_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this shift"
        )
    
    return shift


@router.put("/{shift_id}", response_model=ShiftResponse)
async def update_shift(
    shift_id: int,
    shift_update: ShiftUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a shift (e.g., update notes).
    """
    shift = db.query(Shift).filter(Shift.id == shift_id).first()
    if not shift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Shift with ID {shift_id} not found"
        )
    
    # Check access
    if not current_user.is_superuser and current_user.store_id != shift.store_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this shift"
        )
    
    # Update fields
    if shift_update.notes is not None:
        shift.notes = shift_update.notes
    
    db.commit()
    db.refresh(shift)
    
    return shift


@router.post("/{shift_id}/close", response_model=ShiftResponse)
async def close_shift(
    shift_id: int,
    close_data: ShiftCloseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Close a shift.
    """
    shift = db.query(Shift).filter(Shift.id == shift_id).first()
    if not shift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Shift with ID {shift_id} not found"
        )
    
    # Check access
    if not current_user.is_superuser and current_user.store_id != shift.store_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this shift"
        )
    
    # Check if shift is already closed
    if shift.status == "closed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Shift is already closed"
        )
    
    # Close the shift
    shift.status = "closed"
    shift.closed_by_user_id = current_user.id
    shift.closed_at = datetime.now()
    if close_data.notes:
        shift.notes = (shift.notes or "") + f"\n[Closed] {close_data.notes}"
    
    db.commit()
    db.refresh(shift)
    
    return shift

