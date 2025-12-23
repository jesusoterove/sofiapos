"""
Product management API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from decimal import Decimal
from pathlib import Path
import os

from app.database import get_db
from app.models import Product, Recipe, RecipeMaterial, Material, UnitOfMeasure, StoreProductGroup, KitComponent, StoreProductPrice, Store, ProductImage
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.schemas.recipe_material import RecipeMaterialCreate, RecipeMaterialUpdate, RecipeMaterialResponse
from app.schemas.store_product_group import ProductGroupAssignment
from app.api.v1.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=List[ProductResponse])
async def list_products(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all products."""
    from app.models import ProductTax, Tax
    
    query = db.query(Product).options(joinedload(Product.taxes).joinedload(ProductTax.tax))
    
    if active_only:
        query = query.filter(Product.is_active == True)
    
    products = query.offset(skip).limit(limit).all()
    
    # Convert to response format with calculated tax_rate
    result = []
    for product in products:
        # Calculate total tax rate from all active taxes
        tax_rate = 0.0
        for product_tax in product.taxes:
            if product_tax.is_active and product_tax.tax and product_tax.tax.is_active:
                tax_rate += float(product_tax.tax.rate)
        
        result.append({
            "id": product.id,
            "name": product.name,
            "code": product.code,
            "description": product.description,
            "category_id": product.category_id,
            "product_type": product.product_type,
            "is_active": product.is_active,
            "selling_price": float(product.selling_price),
            "tax_rate": tax_rate,
            "created_at": product.created_at,
            "updated_at": product.updated_at,
        })
    
    return result


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a product by ID."""
    from app.models import ProductTax, Tax
    
    product = db.query(Product).options(
        joinedload(Product.taxes).joinedload(ProductTax.tax)
    ).filter(Product.id == product_id).first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Calculate total tax rate from all active taxes
    tax_rate = 0.0
    for product_tax in product.taxes:
        if product_tax.is_active and product_tax.tax and product_tax.tax.is_active:
            tax_rate += float(product_tax.tax.rate)
    
    return {
        "id": product.id,
        "name": product.name,
        "code": product.code,
        "description": product.description,
        "category_id": product.category_id,
        "product_type": product.product_type,
        "is_active": product.is_active,
        "selling_price": float(product.selling_price),
        "tax_rate": tax_rate,
        "created_at": product.created_at,
        "updated_at": product.updated_at,
    }


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new product."""
    product = Product(
        name=product_data.name,
        code=product_data.code,
        description=product_data.description,
        category_id=product_data.category_id,
        product_type=product_data.product_type,
        is_active=product_data.is_active,
        selling_price=product_data.selling_price,
    )
    
    db.add(product)
    db.commit()
    db.refresh(product)
    
    return {
        "id": product.id,
        "name": product.name,
        "code": product.code,
        "description": product.description,
        "category_id": product.category_id,
        "product_type": product.product_type,
        "is_active": product.is_active,
        "selling_price": float(product.selling_price),
        "tax_rate": 0.0,
        "created_at": product.created_at,
        "updated_at": product.updated_at,
    }


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product_data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a product."""
    from app.models import ProductTax, Tax
    
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Update fields if provided
    if product_data.name is not None:
        product.name = product_data.name
    if product_data.code is not None:
        product.code = product_data.code
    if product_data.description is not None:
        product.description = product_data.description
    if product_data.category_id is not None:
        product.category_id = product_data.category_id
    if product_data.product_type is not None:
        product.product_type = product_data.product_type
    if product_data.is_active is not None:
        product.is_active = product_data.is_active
    if product_data.selling_price is not None:
        product.selling_price = product_data.selling_price
    
    db.commit()
    db.refresh(product)
    
    # Calculate total tax rate
    tax_rate = 0.0
    for product_tax in product.taxes:
        if product_tax.is_active and product_tax.tax and product_tax.tax.is_active:
            tax_rate += float(product_tax.tax.rate)
    
    return {
        "id": product.id,
        "name": product.name,
        "code": product.code,
        "description": product.description,
        "category_id": product.category_id,
        "product_type": product.product_type,
        "is_active": product.is_active,
        "selling_price": float(product.selling_price),
        "tax_rate": tax_rate,
        "created_at": product.created_at,
        "updated_at": product.updated_at,
    }


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a product."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    db.delete(product)
    db.commit()
    return None


@router.get("/{product_id}/recipes", response_model=List[RecipeMaterialResponse])
async def get_product_recipes(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get recipes for a product."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    recipes = db.query(Recipe).filter(Recipe.product_id == product_id).all()
    result = []
    
    for recipe in recipes:
        recipe_materials = db.query(RecipeMaterial).filter(RecipeMaterial.recipe_id == recipe.id).all()
        for rm in recipe_materials:
            material = db.query(Material).filter(Material.id == rm.material_id).first()
            unit_of_measure = db.query(UnitOfMeasure).filter(UnitOfMeasure.id == rm.unit_of_measure_id).first() if rm.unit_of_measure_id else None
            
            result.append({
                "id": rm.id,
                "recipe_id": rm.recipe_id,
                "recipe_name": recipe.name,
                "material_id": rm.material_id,
                "material_name": material.name if material else None,
                "quantity": float(rm.quantity),
                "unit_of_measure_id": rm.unit_of_measure_id,
                "unit_of_measure_name": unit_of_measure.name if unit_of_measure else None,
                "display_order": rm.display_order,
                "created_at": rm.created_at,
                "updated_at": rm.updated_at,
            })
    
    return result


@router.post("/{product_id}/recipes", response_model=RecipeMaterialResponse, status_code=status.HTTP_201_CREATED)
async def create_product_recipe(
    product_id: int,
    recipe_data: RecipeMaterialCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a recipe for a product."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Check if recipe exists, if not create it
    recipe = db.query(Recipe).filter(Recipe.id == recipe_data.recipe_id).first()
    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipe not found"
        )
    
    # Verify recipe belongs to this product
    if recipe.product_id != product_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Recipe does not belong to this product"
        )
    
    recipe_material = RecipeMaterial(
        recipe_id=recipe_data.recipe_id,
        material_id=recipe_data.material_id,
        quantity=recipe_data.quantity,
        unit_of_measure_id=recipe_data.unit_of_measure_id,
        display_order=recipe_data.display_order,
    )
    
    db.add(recipe_material)
    db.commit()
    db.refresh(recipe_material)
    
    material = db.query(Material).filter(Material.id == recipe_material.material_id).first()
    unit_of_measure = db.query(UnitOfMeasure).filter(UnitOfMeasure.id == recipe_material.unit_of_measure_id).first() if recipe_material.unit_of_measure_id else None
    
    return {
        "id": recipe_material.id,
        "recipe_id": recipe_material.recipe_id,
        "recipe_name": recipe.name,
        "material_id": recipe_material.material_id,
        "material_name": material.name if material else None,
        "quantity": float(recipe_material.quantity),
        "unit_of_measure_id": recipe_material.unit_of_measure_id,
        "unit_of_measure_name": unit_of_measure.name if unit_of_measure else None,
        "display_order": recipe_material.display_order,
        "created_at": recipe_material.created_at,
        "updated_at": recipe_material.updated_at,
    }


@router.put("/{product_id}/recipes/{recipe_material_id}", response_model=RecipeMaterialResponse)
async def update_product_recipe(
    product_id: int,
    recipe_material_id: int,
    recipe_data: RecipeMaterialUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a recipe material for a product."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    recipe_material = db.query(RecipeMaterial).filter(RecipeMaterial.id == recipe_material_id).first()
    if not recipe_material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipe material not found"
        )
    
    # Verify recipe belongs to this product
    recipe = db.query(Recipe).filter(Recipe.id == recipe_material.recipe_id).first()
    if not recipe or recipe.product_id != product_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Recipe material does not belong to this product"
        )
    
    if recipe_data.quantity is not None:
        recipe_material.quantity = recipe_data.quantity
    if recipe_data.unit_of_measure_id is not None:
        recipe_material.unit_of_measure_id = recipe_data.unit_of_measure_id
    if recipe_data.display_order is not None:
        recipe_material.display_order = recipe_data.display_order
    
    db.commit()
    db.refresh(recipe_material)
    
    material = db.query(Material).filter(Material.id == recipe_material.material_id).first()
    unit_of_measure = db.query(UnitOfMeasure).filter(UnitOfMeasure.id == recipe_material.unit_of_measure_id).first() if recipe_material.unit_of_measure_id else None
    
    return {
        "id": recipe_material.id,
        "recipe_id": recipe_material.recipe_id,
        "recipe_name": recipe.name,
        "material_id": recipe_material.material_id,
        "material_name": material.name if material else None,
        "quantity": float(recipe_material.quantity),
        "unit_of_measure_id": recipe_material.unit_of_measure_id,
        "unit_of_measure_name": unit_of_measure.name if unit_of_measure else None,
        "display_order": recipe_material.display_order,
        "created_at": recipe_material.created_at,
        "updated_at": recipe_material.updated_at,
    }


@router.delete("/{product_id}/recipes/{recipe_material_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product_recipe(
    product_id: int,
    recipe_material_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a recipe material from a product."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    recipe_material = db.query(RecipeMaterial).filter(RecipeMaterial.id == recipe_material_id).first()
    if not recipe_material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipe material not found"
        )
    
    # Verify recipe belongs to this product
    recipe = db.query(Recipe).filter(Recipe.id == recipe_material.recipe_id).first()
    if not recipe or recipe.product_id != product_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Recipe material does not belong to this product"
        )
    
    db.delete(recipe_material)
    db.commit()
    return None


@router.get("/{product_id}/groups")
async def get_product_groups(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get store product groups for a product."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    groups = product.store_groups
    return [
        {
            "id": group.id,
            "store_id": group.store_id,
            "group_name": group.group_name,
            "created_at": group.created_at,
            "updated_at": group.updated_at,
        }
        for group in groups
    ]


@router.post("/{product_id}/groups", status_code=status.HTTP_204_NO_CONTENT)
async def assign_product_to_group(
    product_id: int,
    assignment: ProductGroupAssignment,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Assign or unassign a product to/from a store product group."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    group = db.query(StoreProductGroup).filter(StoreProductGroup.id == assignment.group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Store product group not found"
        )
    
    if assignment.assigned:
        # Add product to group if not already in it
        if product not in group.products:
            group.products.append(product)
    else:
        # Remove product from group
        if product in group.products:
            group.products.remove(product)
    
    db.commit()
    return None


@router.get("/{product_id}/images")
async def get_product_image(
    product_id: int,
    size: Optional[str] = Query(None, description="Image size (e.g., '110' for 110x110 thumbnail)"),
    db: Session = Depends(get_db)
):
    print("GET PRODUCT IMAGE")
    """
    Get product image.
    If size is provided (e.g., '110'), returns the thumbnail from tiles_110_110 folder.
    Otherwise returns the original image.
    """
    # Get product to verify it exists
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found"
        )
    
    # Get product image
    product_image = db.query(ProductImage).filter(ProductImage.product_id == product_id).first()
    if not product_image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No image found for product {product_id}"
        )
    
    # Determine which file to serve based on size parameter
    if size == "110":
        # Return thumbnail from tiles_110_110 folder
        filename = Path(product_image.image_url).name
        image_path = Path("uploads/product_images/tiles_110_110") / filename
    else:
        # Return original image
        image_path = Path(product_image.image_path) if product_image.image_path else None
        if not image_path:
            # Fallback: construct path from image_url
            filename = Path(product_image.image_url).name
            image_path = Path("uploads/product_images") / filename
    
    # Check if file exists
    if not image_path or not image_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Image file not found for product {product_id}"
        )
    
    # Return file response
    return FileResponse(
        path=str(image_path),
        media_type="image/jpeg",
        filename=image_path.name
    )
