"""
Store management API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from app.database import get_db
from app.models import Store, Order, User
from app.schemas.store import (
    StoreCreate, StoreUpdate, StoreResponse,
    StoreDeleteRequest, StoreDeleteResponse
)
from app.api.v1.auth import get_current_user
from app.services.auth_service import verify_password
from app.services.store_service import ensure_store_tables, ensure_store_document_prefixes
from app.utils.base36 import pad_base36

router = APIRouter(prefix="/stores", tags=["stores"])


def check_store_has_transactions(db: Session, store_id: int) -> dict:
    """
    Check if store has associated transactions/data.
    
    Returns:
        dict: {
            'has_transactions': bool,
            'orders_count': int,
            'users_count': int,
            'products_count': int,
            'shifts_count': int,
            'inventory_entries_count': int
        }
    """
    orders_count = db.query(func.count(Order.id)).filter(Order.store_id == store_id).scalar() or 0
    users_count = db.query(func.count(User.id)).filter(User.store_id == store_id).scalar() or 0
    
    # Check other relationships
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        return {
            'has_transactions': False,
            'orders_count': 0,
            'users_count': 0,
            'products_count': 0,
            'shifts_count': 0,
            'inventory_entries_count': 0
        }
    
    products_count = len(store.products) if store.products else 0
    shifts_count = len(store.shifts) if store.shifts else 0
    inventory_entries_count = len(store.inventory_entries) if store.inventory_entries else 0
    
    has_transactions = (
        orders_count > 0 or
        users_count > 0 or
        products_count > 0 or
        shifts_count > 0 or
        inventory_entries_count > 0
    )
    
    return {
        'has_transactions': has_transactions,
        'orders_count': orders_count,
        'users_count': users_count,
        'products_count': products_count,
        'shifts_count': shifts_count,
        'inventory_entries_count': inventory_entries_count
    }


@router.get("", response_model=List[StoreResponse])
async def list_stores(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all stores."""
    query = db.query(Store)
    
    if active_only:
        query = query.filter(Store.is_active == True)
    
    stores = query.offset(skip).limit(limit).all()
    return stores


@router.get("/{store_id}", response_model=StoreResponse)
async def get_store(
    store_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific store by ID."""
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Store not found"
        )
    return store


@router.post("", response_model=StoreResponse, status_code=status.HTTP_201_CREATED)
async def create_store(
    store_data: StoreCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new store with auto-generated code."""
    # Auto-generate store code from first letter of name + base-36 padded sequence
    first_letter = store_data.name[0].upper() if store_data.name else 'S'
    code_digits = store_data.code_digits or 2
    
    # Find the next available sequence
    sequence = 0
    max_attempts = 36 ** code_digits  # Maximum possible combinations
    store_code = None
    
    for seq in range(max_attempts):
        code_suffix = pad_base36(seq, code_digits)
        candidate_code = f"{first_letter}{code_suffix}"
        
        existing = db.query(Store).filter(Store.code == candidate_code).first()
        if not existing:
            store_code = candidate_code
            break
    
    if store_code is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not generate unique store code. Too many stores with name starting with '{first_letter}'"
        )
    
    # Create store with auto-generated code
    store_dict = store_data.model_dump()
    store_dict['code'] = store_code
    store = Store(**store_dict)
    db.add(store)
    db.commit()
    db.refresh(store)
    
    # Ensure tables exist for the new store
    ensure_store_tables(db, store.id, store.default_tables_count)
    
    # Ensure default document prefixes exist for the store
    ensure_store_document_prefixes(db, store.id)
    
    db.commit()
    db.refresh(store)
    
    return store


@router.put("/{store_id}", response_model=StoreResponse)
async def update_store(
    store_id: int,
    store_data: StoreUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing store."""
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Store not found"
        )
    
    # Code is read-only, cannot be updated
    if store_data.code and store_data.code != store.code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Store code cannot be changed after creation"
        )
    
    # Track if default_tables_count is being changed
    old_default_tables_count = store.default_tables_count
    default_tables_count_changed = False
    
    # Update fields
    update_data = store_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(store, field, value)
        if field == 'default_tables_count' and value != old_default_tables_count:
            default_tables_count_changed = True
    
    db.commit()
    db.refresh(store)
    
    # If default_tables_count changed, ensure tables are updated
    if default_tables_count_changed:
        ensure_store_tables(db, store.id, store.default_tables_count)
        db.commit()
        db.refresh(store)
    
    return store


@router.delete("/{store_id}", response_model=StoreDeleteResponse)
async def delete_store(
    store_id: int,
    delete_request: StoreDeleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a store.
    
    - If no transactions: physical deletion
    - If transactions exist and force=True with password: physical deletion
    - Otherwise: logical deletion (set is_active=False)
    """
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Store not found"
        )
    
    # Verify password
    if not verify_password(delete_request.password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password"
        )
    
    # Check for associated transactions
    transaction_info = check_store_has_transactions(db, store_id)
    
    if not transaction_info['has_transactions']:
        # No transactions - safe to delete physically
        db.delete(store)
        db.commit()
        return StoreDeleteResponse(
            deleted=True,
            message="Store deleted successfully",
            deleted_physically=True
        )
    
    # Has transactions
    if delete_request.force:
        # Force physical deletion with password confirmation
        db.delete(store)
        db.commit()
        return StoreDeleteResponse(
            deleted=True,
            message=f"Store physically deleted. Associated data removed: "
                   f"{transaction_info['orders_count']} orders, "
                   f"{transaction_info['users_count']} users, "
                   f"{transaction_info['products_count']} products, "
                   f"{transaction_info['shifts_count']} shifts, "
                   f"{transaction_info['inventory_entries_count']} inventory entries.",
            deleted_physically=True
        )
    else:
        # Logical deletion
        store.is_active = False
        db.commit()
        return StoreDeleteResponse(
            deleted=True,
            message="Store deactivated (logical deletion). Associated data preserved.",
            deleted_physically=False
        )


@router.get("/{store_id}/transactions", response_model=dict)
async def get_store_transaction_info(
    store_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get information about store's associated transactions."""
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Store not found"
        )
    
    return check_store_has_transactions(db, store_id)

