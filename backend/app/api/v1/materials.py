"""
Material (Ingredient) management API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal

from app.database import get_db
from app.models import Material, Setting
from app.schemas.material import MaterialCreate, MaterialUpdate, MaterialResponse
from app.api.v1.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/materials", tags=["materials"])


def get_money_decimal_places(db: Session) -> int:
    """Get the configured number of decimal places for money values."""
    setting = db.query(Setting).filter(
        Setting.key == "money_decimal_places",
        Setting.store_id == None
    ).first()
    
    if setting and setting.value:
        try:
            return int(setting.value)
        except (ValueError, TypeError):
            pass
    
    return 2  # Default to 2 decimal places


def format_unit_cost(unit_cost: Optional[Decimal]) -> Optional[float]:
    """Convert unit_cost from Decimal to float without formatting."""
    if unit_cost is None:
        return None
    
    # Return raw float value without rounding
    return float(unit_cost)


@router.get("", response_model=List[MaterialResponse])
async def list_materials(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all materials."""
    from sqlalchemy.orm import joinedload
    materials = db.query(Material).options(joinedload(Material.base_uofm)).offset(skip).limit(limit).all()
    
    # Convert to response format with base_uofm_name
    result = []
    for material in materials:
        material_dict = {
            "id": material.id,
            "name": material.name,
            "code": material.code,
            "description": material.description,
            "requires_inventory": material.requires_inventory,
            "base_uofm_id": material.base_uofm_id,
            "unit_cost": format_unit_cost(material.unit_cost),
            "created_at": material.created_at,
            "updated_at": material.updated_at,
            "base_uofm_name": material.base_uofm.abbreviation if material.base_uofm else None,
        }
        result.append(material_dict)
    return result


@router.get("/{material_id}", response_model=MaterialResponse)
async def get_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a material by ID."""
    from sqlalchemy.orm import joinedload
    material = db.query(Material).options(joinedload(Material.base_uofm)).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material not found"
        )
    
    # Convert to response format with base_uofm_name
    return {
        "id": material.id,
        "name": material.name,
        "code": material.code,
        "description": material.description,
        "requires_inventory": material.requires_inventory,
        "base_uofm_id": material.base_uofm_id,
        "unit_cost": format_unit_cost(material.unit_cost),
        "created_at": material.created_at,
        "updated_at": material.updated_at,
        "base_uofm_name": material.base_uofm.abbreviation if material.base_uofm else None,
    }


@router.post("", response_model=MaterialResponse, status_code=status.HTTP_201_CREATED)
async def create_material(
    material_data: MaterialCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new material."""
    from sqlalchemy.orm import joinedload
    # Check if code already exists
    if material_data.code:
        existing = db.query(Material).filter(Material.code == material_data.code).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Material with this code already exists"
            )
    
    material = Material(**material_data.model_dump())
    db.add(material)
    db.commit()
    db.refresh(material)
    # Reload with relationship
    material = db.query(Material).options(joinedload(Material.base_uofm)).filter(Material.id == material.id).first()
    
    return {
        "id": material.id,
        "name": material.name,
        "code": material.code,
        "description": material.description,
        "requires_inventory": material.requires_inventory,
        "base_uofm_id": material.base_uofm_id,
        "unit_cost": format_unit_cost(material.unit_cost),
        "created_at": material.created_at,
        "updated_at": material.updated_at,
        "base_uofm_name": material.base_uofm.abbreviation if material.base_uofm else None,
    }


@router.put("/{material_id}", response_model=MaterialResponse)
async def update_material(
    material_id: int,
    material_data: MaterialUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a material."""
    from sqlalchemy.orm import joinedload
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material not found"
        )
    
    # Check if code already exists (if being updated)
    if material_data.code and material_data.code != material.code:
        existing = db.query(Material).filter(Material.code == material_data.code).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Material with this code already exists"
            )
    
    # Update fields
    update_data = material_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(material, field, value)
    
    db.commit()
    # Reload with relationship
    material = db.query(Material).options(joinedload(Material.base_uofm)).filter(Material.id == material_id).first()
    
    return {
        "id": material.id,
        "name": material.name,
        "code": material.code,
        "description": material.description,
        "requires_inventory": material.requires_inventory,
        "base_uofm_id": material.base_uofm_id,
        "unit_cost": format_unit_cost(material.unit_cost),
        "created_at": material.created_at,
        "updated_at": material.updated_at,
        "base_uofm_name": material.base_uofm.abbreviation if material.base_uofm else None,
    }


@router.delete("/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a material."""
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material not found"
        )
    
    # Check if material is used in recipes
    if material.recipe_materials:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete material that is used in recipes"
        )
    
    db.delete(material)
    db.commit()
    return None

