"""
Inventory control configuration API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import InventoryControlConfig, Store, Product, Material, UnitOfMeasure
from app.api.v1.auth import get_current_user
from app.schemas.inventory_control import InventoryControlConfigResponse

router = APIRouter(prefix="/inventory-control", tags=["inventory-control"])


@router.get("/config", response_model=List[InventoryControlConfigResponse])
async def get_inventory_control_config(
    store_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get inventory control configuration for a store.
    Returns only items with ShowInInventory=true, ordered by Priority.
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
    
    # Get inventory control config items
    config_items = db.query(InventoryControlConfig).filter(
        InventoryControlConfig.show_in_inventory == True
    ).order_by(InventoryControlConfig.priority.asc()).all()
    
    # Enrich with related data
    result = []
    for item in config_items:
        item_dict = {
            "id": item.id,
            "item_type": item.item_type,
            "product_id": item.product_id,
            "material_id": item.material_id,
            "show_in_inventory": item.show_in_inventory,
            "priority": item.priority,
            "uofm1_id": item.uofm1_id,
            "uofm2_id": item.uofm2_id,
            "uofm3_id": item.uofm3_id,
            "product_name": None,
            "material_name": None,
            "uofm1_abbreviation": None,
            "uofm2_abbreviation": None,
            "uofm3_abbreviation": None,
        }
        
        if item.product_id:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if product:
                item_dict["product_name"] = product.name
        
        if item.material_id:
            material = db.query(Material).filter(Material.id == item.material_id).first()
            if material:
                item_dict["material_name"] = material.name
        
        if item.uofm1_id:
            uofm = db.query(UnitOfMeasure).filter(UnitOfMeasure.id == item.uofm1_id).first()
            if uofm:
                item_dict["uofm1_abbreviation"] = uofm.abbreviation
        
        if item.uofm2_id:
            uofm = db.query(UnitOfMeasure).filter(UnitOfMeasure.id == item.uofm2_id).first()
            if uofm:
                item_dict["uofm2_abbreviation"] = uofm.abbreviation
        
        if item.uofm3_id:
            uofm = db.query(UnitOfMeasure).filter(UnitOfMeasure.id == item.uofm3_id).first()
            if uofm:
                item_dict["uofm3_abbreviation"] = uofm.abbreviation
        
        result.append(InventoryControlConfigResponse(**item_dict))
    
    return result

