"""
Product categories API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import ProductCategory
from app.api.v1.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/product-categories", tags=["product-categories"])


@router.get("", response_model=List[dict])
async def list_product_categories(
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all product categories."""
    query = db.query(ProductCategory)
    
    if active_only:
        query = query.filter(ProductCategory.is_active == True)
    
    categories = query.order_by(ProductCategory.display_order, ProductCategory.name).all()
    
    return [
        {
            "id": category.id,
            "name": category.name,
            "description": category.description,
            "parent_id": category.parent_id,
            "display_order": category.display_order,
            "is_active": category.is_active,
            "created_at": category.created_at.isoformat() if category.created_at else None,
            "updated_at": category.updated_at.isoformat() if category.updated_at else None,
        }
        for category in categories
    ]

