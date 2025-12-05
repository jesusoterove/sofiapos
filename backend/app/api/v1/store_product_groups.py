"""
Store Product Group management API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models import StoreProductGroup, Store, Product
from app.schemas.store_product_group import (
    StoreProductGroupCreate, StoreProductGroupUpdate, StoreProductGroupResponse
)
from app.api.v1.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/store-product-groups", tags=["store-product-groups"])


@router.get("", response_model=List[StoreProductGroupResponse])
async def list_store_product_groups(
    store_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all store product groups."""
    query = db.query(StoreProductGroup)
    
    if store_id:
        query = query.filter(StoreProductGroup.store_id == store_id)
    
    groups = query.all()
    return groups


@router.get("/{group_id}", response_model=StoreProductGroupResponse)
async def get_store_product_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a store product group by ID."""
    group = db.query(StoreProductGroup).filter(StoreProductGroup.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Store product group not found"
        )
    return group


@router.post("", response_model=StoreProductGroupResponse, status_code=status.HTTP_201_CREATED)
async def create_store_product_group(
    group_data: StoreProductGroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new store product group."""
    # Verify store exists
    store = db.query(Store).filter(Store.id == group_data.store_id).first()
    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Store not found"
        )
    
    # Check if group with same name already exists for this store
    existing = db.query(StoreProductGroup).filter(
        StoreProductGroup.store_id == group_data.store_id,
        StoreProductGroup.group_name == group_data.group_name
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Store product group with this name already exists for this store"
        )
    
    # Prevent deletion of bookmark group
    if group_data.group_name == "bookmarks":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create a group named 'bookmarks' - it is reserved"
        )
    
    group = StoreProductGroup(**group_data.model_dump())
    db.add(group)
    db.commit()
    db.refresh(group)
    return group


@router.put("/{group_id}", response_model=StoreProductGroupResponse)
async def update_store_product_group(
    group_id: int,
    group_data: StoreProductGroupUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a store product group."""
    group = db.query(StoreProductGroup).filter(StoreProductGroup.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Store product group not found"
        )
    
    # Prevent renaming bookmark group
    if group.group_name == "bookmarks" and group_data.group_name and group_data.group_name != "bookmarks":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot rename the 'bookmarks' group"
        )
    
    # Check if new name already exists for this store
    if group_data.group_name and group_data.group_name != group.group_name:
        existing = db.query(StoreProductGroup).filter(
            StoreProductGroup.store_id == group.store_id,
            StoreProductGroup.group_name == group_data.group_name
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Store product group with this name already exists for this store"
            )
    
    # Update fields
    update_data = group_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(group, field, value)
    
    db.commit()
    db.refresh(group)
    return group


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_store_product_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a store product group."""
    group = db.query(StoreProductGroup).filter(StoreProductGroup.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Store product group not found"
        )
    
    # Prevent deletion of bookmark group
    if group.group_name == "bookmarks":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete the 'bookmarks' group"
        )
    
    db.delete(group)
    db.commit()
    return None

