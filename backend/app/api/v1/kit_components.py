"""
Kit Component management API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from app.database import get_db
from app.models import KitComponent, Product
from app.schemas.kit_component import (
    KitComponentCreate, KitComponentUpdate, KitComponentResponse
)
from app.api.v1.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/kit-components", tags=["kit-components"])


@router.get("", response_model=List[KitComponentResponse])
async def list_kit_components(
    product_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all kit components."""
    query = db.query(KitComponent).options(joinedload(KitComponent.component))
    
    if product_id:
        query = query.filter(KitComponent.product_id == product_id)
    
    components = query.all()
    # Convert to response format
    result = []
    for component in components:
        result.append({
            "id": component.id,
            "product_id": component.product_id,
            "component_id": component.component_id,
            "quantity": float(component.quantity) if component.quantity is not None else None,
            "created_at": component.created_at,
            "updated_at": component.updated_at,
            "component_name": component.component.name if component.component else None,
            "component_code": component.component.code if component.component else None,
        })
    return result


@router.get("/{component_id}", response_model=KitComponentResponse)
async def get_kit_component(
    component_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a kit component by ID."""
    component = db.query(KitComponent).options(joinedload(KitComponent.component)).filter(
        KitComponent.id == component_id
    ).first()
    if not component:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kit component not found"
        )
    
    return {
        "id": component.id,
        "product_id": component.product_id,
        "component_id": component.component_id,
        "quantity": float(component.quantity) if component.quantity is not None else None,
        "created_at": component.created_at,
        "updated_at": component.updated_at,
        "component_name": component.component.name if component.component else None,
        "component_code": component.component.code if component.component else None,
    }


@router.post("", response_model=KitComponentResponse, status_code=status.HTTP_201_CREATED)
async def create_kit_component(
    component_data: KitComponentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new kit component."""
    # Verify product exists and is a kit
    product = db.query(Product).filter(Product.id == component_data.product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    if product.product_type.value != "kit":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product must be of type 'kit' to have components"
        )
    
    # Verify component product exists
    component_product = db.query(Product).filter(Product.id == component_data.component_id).first()
    if not component_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Component product not found"
        )
    
    # Prevent self-reference
    if component_data.product_id == component_data.component_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A product cannot be a component of itself"
        )
    
    # Check if component already exists
    existing = db.query(KitComponent).filter(
        KitComponent.product_id == component_data.product_id,
        KitComponent.component_id == component_data.component_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This component already exists for this kit"
        )
    
    component = KitComponent(**component_data.model_dump())
    db.add(component)
    db.commit()
    db.refresh(component)
    
    # Reload with relationship
    component = db.query(KitComponent).options(joinedload(KitComponent.component)).filter(
        KitComponent.id == component.id
    ).first()
    
    return {
        "id": component.id,
        "product_id": component.product_id,
        "component_id": component.component_id,
        "quantity": float(component.quantity) if component.quantity is not None else None,
        "created_at": component.created_at,
        "updated_at": component.updated_at,
        "component_name": component.component.name if component.component else None,
        "component_code": component.component.code if component.component else None,
    }


@router.put("/{component_id}", response_model=KitComponentResponse)
async def update_kit_component(
    component_id: int,
    component_data: KitComponentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a kit component."""
    component = db.query(KitComponent).filter(KitComponent.id == component_id).first()
    if not component:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kit component not found"
        )
    
    # Update fields
    update_data = component_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(component, field, value)
    
    db.commit()
    db.refresh(component)
    
    # Reload with relationship
    component = db.query(KitComponent).options(joinedload(KitComponent.component)).filter(
        KitComponent.id == component_id
    ).first()
    
    return {
        "id": component.id,
        "product_id": component.product_id,
        "component_id": component.component_id,
        "quantity": float(component.quantity) if component.quantity is not None else None,
        "created_at": component.created_at,
        "updated_at": component.updated_at,
        "component_name": component.component.name if component.component else None,
        "component_code": component.component.code if component.component else None,
    }


@router.delete("/{component_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_kit_component(
    component_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a kit component."""
    component = db.query(KitComponent).filter(KitComponent.id == component_id).first()
    if not component:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kit component not found"
        )
    
    db.delete(component)
    db.commit()
    return None

