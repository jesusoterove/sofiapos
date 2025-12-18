"""
Recipes API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from app.database import get_db
from app.models import Recipe, RecipeMaterial, Product
from app.api.v1.auth import get_current_user
from app.models import User
from app.schemas.recipe import RecipeResponse, RecipeCreate, RecipeUpdate
from app.schemas.recipe_material import RecipeMaterialResponse

router = APIRouter(prefix="/recipes", tags=["recipes"])


@router.get("", response_model=List[RecipeResponse])
async def list_recipes(
    active_only: bool = True,
    product_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all recipes.
    Recipes are global (not store-specific).
    """
    query = db.query(Recipe).options(joinedload(Recipe.materials))
    
    if active_only:
        query = query.filter(Recipe.is_active == True)
    
    if product_id:
        query = query.filter(Recipe.product_id == product_id)
    
    recipes = query.all()
    
    # Convert to response format
    result = []
    for recipe in recipes:
        recipe_dict = {
            "id": recipe.id,
            "product_id": recipe.product_id,
            "name": recipe.name,
            "description": recipe.description,
            "yield_quantity": float(recipe.yield_quantity),
            "yield_unit_of_measure_id": recipe.yield_unit_of_measure_id,
            "is_active": recipe.is_active,
            "created_at": recipe.created_at.isoformat() if recipe.created_at else None,
            "updated_at": recipe.updated_at.isoformat() if recipe.updated_at else None,
            "materials": [
                {
                    "id": material.id,
                    "recipe_id": material.recipe_id,
                    "material_id": material.material_id,
                    "quantity": float(material.quantity),
                    "unit_of_measure_id": material.unit_of_measure_id,
                    "display_order": material.display_order,
                    "created_at": material.created_at.isoformat() if material.created_at else None,
                    "updated_at": material.updated_at.isoformat() if material.updated_at else None,
                }
                for material in recipe.materials
            ] if recipe.materials else [],
        }
        result.append(recipe_dict)
    
    return result


@router.get("/{recipe_id}", response_model=RecipeResponse)
async def get_recipe(
    recipe_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single recipe by ID."""
    recipe = db.query(Recipe).options(joinedload(Recipe.materials)).filter(Recipe.id == recipe_id).first()
    
    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recipe with ID {recipe_id} not found"
        )
    
    return {
        "id": recipe.id,
        "product_id": recipe.product_id,
        "name": recipe.name,
        "description": recipe.description,
        "yield_quantity": float(recipe.yield_quantity),
        "yield_unit_of_measure_id": recipe.yield_unit_of_measure_id,
        "is_active": recipe.is_active,
        "created_at": recipe.created_at.isoformat() if recipe.created_at else None,
        "updated_at": recipe.updated_at.isoformat() if recipe.updated_at else None,
        "materials": [
            {
                "id": material.id,
                "recipe_id": material.recipe_id,
                "material_id": material.material_id,
                "quantity": float(material.quantity),
                "unit_of_measure_id": material.unit_of_measure_id,
                "display_order": material.display_order,
                "created_at": material.created_at.isoformat() if material.created_at else None,
                "updated_at": material.updated_at.isoformat() if material.updated_at else None,
            }
            for material in recipe.materials
        ] if recipe.materials else [],
    }


@router.get("/{recipe_id}/materials", response_model=List[RecipeMaterialResponse])
async def get_recipe_materials(
    recipe_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get materials for a specific recipe."""
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    
    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recipe with ID {recipe_id} not found"
        )
    
    materials = db.query(RecipeMaterial).filter(RecipeMaterial.recipe_id == recipe_id).order_by(RecipeMaterial.display_order).all()
    
    return [
        {
            "id": material.id,
            "recipe_id": material.recipe_id,
            "material_id": material.material_id,
            "quantity": float(material.quantity),
            "unit_of_measure_id": material.unit_of_measure_id,
            "display_order": material.display_order,
            "created_at": material.created_at.isoformat() if material.created_at else None,
            "updated_at": material.updated_at.isoformat() if material.updated_at else None,
        }
        for material in materials
    ]

