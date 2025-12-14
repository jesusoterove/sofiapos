"""
Shift management API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models import Shift, ShiftUser, ShiftInventory, Store, User, Product, Material, UnitOfMeasure, DocumentPrefix, CashRegister, CashRegisterHistory
from app.schemas.shift import (
    ShiftOpenRequest, ShiftResponse, ShiftUpdate, ShiftCloseRequest, ShiftInventoryEntryResponse
)
from app.schemas.inventory_control import ShiftInventoryEntry
from app.api.v1.auth import get_current_user
from app.utils.base36 import encode_base36, pad_base36

router = APIRouter(prefix="/shifts", tags=["shifts"])


def generate_shift_number(db: Session, cash_register_id: int) -> str:
    """
    Generate a unique shift number for a cash register.
    Format: {prefix}{cash_register_code}-{date_base36}{sequence_base36}
    Example: TSAA-AAA-ABC1234AB (where T is prefix, SAA-AAA is cash register code, ABC1234 is base36 date, AB is base36 sequence)
    """
    # Get cash register
    cash_register = db.query(CashRegister).filter(CashRegister.id == cash_register_id).first()
    if not cash_register:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cash register with ID {cash_register_id} not found"
        )
    
    # Get shift document prefix from store
    doc_prefix = db.query(DocumentPrefix).filter(
        DocumentPrefix.store_id == cash_register.store_id,
        DocumentPrefix.doc_type == 'shift',
        DocumentPrefix.is_active == True
    ).first()
    
    if not doc_prefix:
        prefix = ''
    else:
        prefix = doc_prefix.prefix
    
    # Get current date in yyyyMMdd format and encode to base36
    now = datetime.now()
    date_str = now.strftime("%Y%m%d")  # yyyyMMdd format
    date_number = int(date_str)  # Convert to integer
    date_base36 = encode_base36(date_number)  # Encode to base36
    
    # Count shifts for this cash register today to get sequence number
    # Find shifts through CashRegisterHistory
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    shift_count = db.query(func.count(Shift.id)).join(
        CashRegisterHistory, CashRegisterHistory.shift_id == Shift.id
    ).filter(
        CashRegisterHistory.cash_register_id == cash_register_id,
        Shift.opened_at >= today_start
    ).scalar() or 0
    
    # Generate sequence number (next sequence = count + 1)
    sequence_number = shift_count + 1
    sequence_base36 = pad_base36(sequence_number, 2)  # Pad to 2 characters with 'A'
    
    # Combine: prefix + cash_register_code + '-' + base36(date) + base36(sequence, 2 chars)
    shift_number = f"{prefix}{cash_register.code}-{date_base36}{sequence_base36}"
    
    return shift_number


@router.get("/open", response_model=Optional[ShiftResponse])
async def get_open_shift(
    cash_register_id: Optional[int] = None,
    cash_register_code: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get the currently open shift for a cash register.
    Returns null if no open shift exists (for offline-first compatibility).
    Requires either cash_register_id or cash_register_code.
    """
    # Validate that at least one identifier is provided
    if not cash_register_id and not cash_register_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either cash_register_id or cash_register_code is required"
        )
    
    # Get cash register
    cash_register = None
    if cash_register_id:
        cash_register = db.query(CashRegister).filter(CashRegister.id == cash_register_id).first()
    elif cash_register_code:
        cash_register = db.query(CashRegister).filter(CashRegister.code == cash_register_code).first()
    
    if not cash_register:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cash register not found"
        )
    
    # Check if user has access to this store
    if not current_user.is_superuser and current_user.store_id != cash_register.store_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this cash register's store"
        )
    
    # Find open shift for this cash register through CashRegisterHistory
    open_shift = db.query(Shift).join(
        CashRegisterHistory, CashRegisterHistory.shift_id == Shift.id
    ).filter(
        CashRegisterHistory.cash_register_id == cash_register.id,
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
    Open a new shift for a cash register.
    Requires initial cash amount and optionally inventory balance.
    Store is inferred from the cash register.
    """
    # Validate that at least one cash register identifier is provided
    if not shift_data.cash_register_id and not shift_data.cash_register_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either cash_register_id or cash_register_code is required to identify which cash register the shift belongs to"
        )
    
    # Validate and get cash register
    cash_register = None
    if shift_data.cash_register_id:
        cash_register = db.query(CashRegister).filter(
            CashRegister.id == shift_data.cash_register_id,
            CashRegister.is_active == True
        ).first()
        if not cash_register:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cash register with ID {shift_data.cash_register_id} not found or not active"
            )
    elif shift_data.cash_register_code:
        cash_register = db.query(CashRegister).filter(
            CashRegister.code == shift_data.cash_register_code,
            CashRegister.is_active == True
        ).first()
        if not cash_register:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cash register with code '{shift_data.cash_register_code}' not found or not active"
            )
    
    # Get store from cash register
    store = cash_register.store
    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Store not found for cash register '{cash_register.code}'"
        )
    
    # Check if user has access to this store
    if not current_user.is_superuser and current_user.store_id != store.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this cash register's store"
        )
    
    # Check if there's already an open shift for this cash register (not per store, per cash register)
    existing_open_shift = db.query(Shift).join(
        CashRegisterHistory, CashRegisterHistory.shift_id == Shift.id
    ).filter(
        CashRegisterHistory.cash_register_id == cash_register.id,
        Shift.status == "open"
    ).first()
    
    if existing_open_shift:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A shift is already open for cash register '{cash_register.code}' (Shift #{existing_open_shift.shift_number})"
        )
    
    # Check if inventory balance is required
    if store.requires_start_inventory and shift_data.inventory_balance is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inventory beginning balance is required for this store"
        )
    
    # Use provided shift_number if available, otherwise generate one
    if shift_data.shift_number:
        shift_number = shift_data.shift_number
        # Verify shift number doesn't already exist
        existing_shift = db.query(Shift).filter(
            Shift.shift_number == shift_number
        ).first()
        if existing_shift:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Shift number '{shift_number}' already exists"
            )
    else:
        shift_number = generate_shift_number(db, cash_register.id)
    
    # Build notes with initial cash and inventory balance
    notes_parts = []
    if shift_data.initial_cash:
        notes_parts.append(f"Initial cash: {shift_data.initial_cash}")
    if shift_data.inventory_balance is not None:
        notes_parts.append(f"Initial inventory balance: {shift_data.inventory_balance}")
    notes = "\n".join(notes_parts) if notes_parts else None
    
    # Create new shift (store_id inferred from cash register)
    new_shift = Shift(
        store_id=store.id,
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
    
    # Create cash register history entry with initial_cash
    cash_register_history = CashRegisterHistory(
        cash_register_id=cash_register.id,
        shift_id=new_shift.id,
        status="open",
        opening_balance=shift_data.initial_cash,
        opened_by_user_id=current_user.id
    )
    db.add(cash_register_history)
    
    db.commit()
    db.refresh(new_shift)
    
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
    
    # Find associated cash register history entry
    cash_register_history = db.query(CashRegisterHistory).filter(
        CashRegisterHistory.shift_id == shift.id,
        CashRegisterHistory.status == "open"
    ).first()
    
    if not cash_register_history:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Shift {shift.shift_number} is not associated with an open cash register history entry"
        )
    
    # Close the shift
    shift.status = "closed"
    shift.closed_by_user_id = current_user.id
    shift.closed_at = datetime.now()
    if close_data.notes:
        shift.notes = (shift.notes or "") + f"\n[Closed] {close_data.notes}"
    
    # Close the cash register history entry
    cash_register_history.status = "closed"
    cash_register_history.closed_by_user_id = current_user.id
    cash_register_history.closed_at = datetime.now()
    if close_data.final_cash is not None:
        cash_register_history.closing_balance = close_data.final_cash
        # Calculate difference if expected_balance is set
        if cash_register_history.expected_balance is not None:
            cash_register_history.difference = close_data.final_cash - cash_register_history.expected_balance
    
    db.commit()
    db.refresh(shift)
    
    return shift


@router.post("/{shift_id}/close-with-inventory", response_model=ShiftResponse)
async def close_shift_with_inventory(
    shift_id: int,
    close_data: dict,  # Will use ShiftCloseWithInventoryRequest from inventory_control schema
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Close a shift with inventory end balances.
    """
    from app.schemas.inventory_control import ShiftCloseWithInventoryRequest
    
    # Parse the request
    close_request = ShiftCloseWithInventoryRequest(**close_data)
    
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
    
    # Find associated cash register history entry
    cash_register_history = db.query(CashRegisterHistory).filter(
        CashRegisterHistory.shift_id == shift.id,
        CashRegisterHistory.status == "open"
    ).first()
    
    if not cash_register_history:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Shift {shift.shift_number} is not associated with an open cash register history entry"
        )
    
    # Close the shift
    shift.status = "closed"
    shift.closed_by_user_id = current_user.id
    shift.closed_at = datetime.now()
    if close_request.notes:
        shift.notes = (shift.notes or "") + f"\n[Closed] {close_request.notes}"
    
    # Close the cash register history entry
    cash_register_history.status = "closed"
    cash_register_history.closed_by_user_id = current_user.id
    cash_register_history.closed_at = datetime.now()
    if close_request.final_cash is not None:
        cash_register_history.closing_balance = close_request.final_cash
        # Calculate difference if expected_balance is set
        if cash_register_history.expected_balance is not None:
            cash_register_history.difference = close_request.final_cash - cash_register_history.expected_balance
    
    # Create inventory entries for end balances
    for entry in close_request.inventory_entries:
        inventory_entry = ShiftInventory(
            shift_id=shift.id,
            entry_type="end_bal",
            product_id=entry.product_id,
            material_id=entry.material_id,
            uofm_id=entry.uofm_id,
            quantity=entry.quantity
        )
        db.add(inventory_entry)
    
    db.commit()
    db.refresh(shift)
    
    return shift


@router.get("/{shift_id}/inventory", response_model=List[ShiftInventoryEntryResponse])
async def get_shift_inventory(
    shift_id: int,
    entry_type: Optional[str] = None,  # 'beg_bal', 'refill', 'end_bal'
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get inventory entries for a shift.
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
    
    # Query inventory entries
    query = db.query(ShiftInventory).filter(ShiftInventory.shift_id == shift_id)
    
    if entry_type:
        query = query.filter(ShiftInventory.entry_type == entry_type)
    
    entries = query.all()
    
    # Enrich with related data
    result = []
    for entry in entries:
        entry_dict = {
            "rec_id": entry.rec_id,
            "shift_id": entry.shift_id,
            "entry_type": entry.entry_type,
            "product_id": entry.product_id,
            "material_id": entry.material_id,
            "uofm_id": entry.uofm_id,
            "quantity": float(entry.quantity),
            "created_dt": entry.created_dt,
            "product_name": None,
            "material_name": None,
            "uofm_abbreviation": None,
        }
        
        if entry.product_id:
            product = db.query(Product).filter(Product.id == entry.product_id).first()
            if product:
                entry_dict["product_name"] = product.name
        
        if entry.material_id:
            material = db.query(Material).filter(Material.id == entry.material_id).first()
            if material:
                entry_dict["material_name"] = material.name
        
        if entry.uofm_id:
            uofm = db.query(UnitOfMeasure).filter(UnitOfMeasure.id == entry.uofm_id).first()
            if uofm:
                entry_dict["uofm_abbreviation"] = uofm.abbreviation
        
        result.append(ShiftInventoryEntryResponse(**entry_dict))
    
    return result

