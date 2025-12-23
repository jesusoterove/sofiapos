"""
Inventory transactions API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import List, Optional, Union, Any
from decimal import Decimal

from app.database import get_db
from app.models import InventoryEntry, InventoryTransaction, Store, User
from app.schemas.inventory import (
    InventoryTransactionCreate, InventoryTransactionUpdate, InventoryTransactionResponse
)
from app.api.v1.auth import get_current_user

router = APIRouter(prefix="/inventory-transactions", tags=["inventory-transactions"])


@router.post("", response_model=InventoryTransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_inventory_transaction(
    transaction_data: Union[InventoryTransactionCreate, dict] = Body(...),  # Accept both Pydantic model and dict
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new inventory transaction.
    Handles both Pydantic schema (from frontend) and dict (from sync).
    """
    # Parse transaction_data - handle both dict (from sync) and Pydantic model
    if isinstance(transaction_data, dict):
        # Handle dict from sync (flexible field names)
        entry_id = transaction_data.get('entry_id')
        entry_number = transaction_data.get('entry_number')
        material_id = transaction_data.get('material_id')
        product_id = transaction_data.get('product_id')
        quantity = transaction_data.get('quantity')
        unit_of_measure_id = transaction_data.get('unit_of_measure_id')
        unit_cost = transaction_data.get('unit_cost')
        total_cost = transaction_data.get('total_cost')
        notes = transaction_data.get('notes')
    else:
        # Handle Pydantic model
        entry_id = transaction_data.entry_id
        entry_number = transaction_data.entry_number
        material_id = transaction_data.material_id
        product_id = transaction_data.product_id
        quantity = transaction_data.quantity
        unit_of_measure_id = transaction_data.unit_of_measure_id
        unit_cost = transaction_data.unit_cost
        total_cost = transaction_data.total_cost
        notes = transaction_data.notes
    
    # Find entry_id if not provided but entry_number is
    if not entry_id and entry_number:
        entry = db.query(InventoryEntry).filter(
            InventoryEntry.entry_number == entry_number
        ).first()
        if not entry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Inventory entry with entry_number '{entry_number}' not found"
            )
        entry_id = entry.id
        
        # Check if user has access to this entry's store
        if not current_user.is_superuser and current_user.store_id != entry.store_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this inventory entry"
            )
    elif not entry_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either entry_id or entry_number must be provided"
        )
    else:
        # Verify entry exists and user has access
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
    
    # Validate that either material_id or product_id is provided
    if not material_id and not product_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either material_id or product_id must be provided"
        )
    
    # Validate quantity
    if quantity is None or quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="quantity must be greater than 0"
        )
    
    # Convert costs to Decimal if provided
    unit_cost_decimal = None
    if unit_cost is not None:
        unit_cost_decimal = Decimal(str(unit_cost))
    
    total_cost_decimal = None
    if total_cost is not None:
        total_cost_decimal = Decimal(str(total_cost))
    
    # Create inventory transaction
    inventory_transaction = InventoryTransaction(
        entry_id=entry_id,
        material_id=material_id,
        product_id=product_id,
        quantity=Decimal(str(quantity)),
        unit_of_measure_id=unit_of_measure_id,
        unit_cost=unit_cost_decimal,
        total_cost=total_cost_decimal,
        notes=notes,
    )
    
    db.add(inventory_transaction)
    db.commit()
    db.refresh(inventory_transaction)
    
    return inventory_transaction


@router.get("", response_model=List[InventoryTransactionResponse])
async def list_inventory_transactions(
    entry_id: Optional[int] = None,
    entry_number: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List inventory transactions.
    """
    query = db.query(InventoryTransaction)
    
    if entry_id:
        query = query.filter(InventoryTransaction.entry_id == entry_id)
    elif entry_number:
        # Find entry by entry_number
        entry = db.query(InventoryEntry).filter(
            InventoryEntry.entry_number == entry_number
        ).first()
        if not entry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Inventory entry with entry_number '{entry_number}' not found"
            )
        
        # Check if user has access to this entry's store
        if not current_user.is_superuser and current_user.store_id != entry.store_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this inventory entry"
            )
        
        query = query.filter(InventoryTransaction.entry_id == entry.id)
    else:
        # If no filter, only show transactions for entries the user has access to
        if not current_user.is_superuser:
            # Get store_id for non-superusers
            store_ids = [current_user.store_id]
            # Get entry IDs for this store
            entry_ids = db.query(InventoryEntry.id).filter(
                InventoryEntry.store_id.in_(store_ids)
            ).subquery()
            query = query.filter(InventoryTransaction.entry_id.in_(entry_ids))
    
    transactions = query.all()
    return transactions


@router.get("/{transaction_id}", response_model=InventoryTransactionResponse)
async def get_inventory_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific inventory transaction by ID.
    """
    transaction = db.query(InventoryTransaction).filter(
        InventoryTransaction.id == transaction_id
    ).first()
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inventory transaction with ID {transaction_id} not found"
        )
    
    # Check if user has access to this transaction's entry's store
    entry = db.query(InventoryEntry).filter(InventoryEntry.id == transaction.entry_id).first()
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated inventory entry not found"
        )
    
    if not current_user.is_superuser and current_user.store_id != entry.store_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this inventory transaction"
        )
    
    return transaction


@router.put("/{transaction_id}", response_model=InventoryTransactionResponse)
async def update_inventory_transaction(
    transaction_id: int,
    transaction_data: Union[InventoryTransactionUpdate, dict] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update an inventory transaction.
    """
    transaction = db.query(InventoryTransaction).filter(
        InventoryTransaction.id == transaction_id
    ).first()
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inventory transaction with ID {transaction_id} not found"
        )
    
    # Check if user has access to this transaction's entry's store
    entry = db.query(InventoryEntry).filter(InventoryEntry.id == transaction.entry_id).first()
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated inventory entry not found"
        )
    
    if not current_user.is_superuser and current_user.store_id != entry.store_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this inventory transaction"
        )
    
    # Parse transaction_data - handle both dict and Pydantic model
    if isinstance(transaction_data, dict):
        if 'material_id' in transaction_data:
            transaction.material_id = transaction_data.get('material_id')
        if 'product_id' in transaction_data:
            transaction.product_id = transaction_data.get('product_id')
        if 'quantity' in transaction_data:
            quantity = transaction_data.get('quantity')
            if quantity is not None:
                transaction.quantity = Decimal(str(quantity))
        if 'unit_of_measure_id' in transaction_data:
            transaction.unit_of_measure_id = transaction_data.get('unit_of_measure_id')
        if 'unit_cost' in transaction_data:
            unit_cost = transaction_data.get('unit_cost')
            transaction.unit_cost = Decimal(str(unit_cost)) if unit_cost is not None else None
        if 'total_cost' in transaction_data:
            total_cost = transaction_data.get('total_cost')
            transaction.total_cost = Decimal(str(total_cost)) if total_cost is not None else None
        if 'notes' in transaction_data:
            transaction.notes = transaction_data.get('notes')
    else:
        if transaction_data.material_id is not None:
            transaction.material_id = transaction_data.material_id
        if transaction_data.product_id is not None:
            transaction.product_id = transaction_data.product_id
        if transaction_data.quantity is not None:
            transaction.quantity = Decimal(str(transaction_data.quantity))
        if transaction_data.unit_of_measure_id is not None:
            transaction.unit_of_measure_id = transaction_data.unit_of_measure_id
        if transaction_data.unit_cost is not None:
            transaction.unit_cost = Decimal(str(transaction_data.unit_cost))
        if transaction_data.total_cost is not None:
            transaction.total_cost = Decimal(str(transaction_data.total_cost))
        if transaction_data.notes is not None:
            transaction.notes = transaction_data.notes
    
    db.commit()
    db.refresh(transaction)
    
    return transaction

