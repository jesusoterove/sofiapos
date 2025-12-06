"""
Product management API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from decimal import Decimal

from app.database import get_db
from app.models import Product, Recipe, RecipeMaterial, Material, UnitOfMeasure, StoreProductGroup, KitComponent, StoreProductPrice, Store
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
    query = db.query(Product)
    
    if active_only:
        query = query.filter(Product.is_active == True)
    
    products = query.offset(skip).limit(limit).all()
    return products


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a product by ID."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    return product


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new product."""
    # Check if code already exists (globally, since products are global)
    if product_data.code:
        existing = db.query(Product).filter(Product.code == product_data.code).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product with this code already exists"
            )
    
    product = Product(**product_data.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product_data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a product."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Check if code already exists (if being updated)
    if product_data.code and product_data.code != product.code:
        existing = db.query(Product).filter(Product.code == product_data.code).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product with this code already exists"
            )
    
    # Update fields
    update_data = product_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
    
    db.commit()
    db.refresh(product)
    return product


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
    
    # Check if product is used in orders
    if product.order_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete product that is used in orders"
        )
    
    db.delete(product)
    db.commit()
    return None


# Recipe Materials endpoints (for ingredients tab)
@router.get("/{product_id}/recipe-materials", response_model=List[RecipeMaterialResponse])
async def list_product_recipe_materials(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all recipe materials for a product."""
    # Verify product exists and is prepared
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    if product.product_type.value != "prepared":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product must be of type 'prepared' to have recipe materials"
        )
    
    # Get or create recipe for this product
    recipe = db.query(Recipe).filter(Recipe.product_id == product_id).first()
    if not recipe:
        # Create default recipe
        recipe = Recipe(
            product_id=product_id,
            name=f"Recipe for {product.name}",
            yield_quantity=Decimal("1.0"),
            is_active=True
        )
        db.add(recipe)
        db.commit()
        db.refresh(recipe)
    
    # Get recipe materials
    recipe_materials = db.query(RecipeMaterial).options(
        joinedload(RecipeMaterial.material),
        joinedload(RecipeMaterial.unit_of_measure)
    ).filter(RecipeMaterial.recipe_id == recipe.id).all()
    
    # Convert to response format
    result = []
    for rm in recipe_materials:
        result.append({
            "id": rm.id,
            "recipe_id": rm.recipe_id,
            "material_id": rm.material_id,
            "quantity": float(rm.quantity) if rm.quantity is not None else None,
            "unit_of_measure_id": rm.unit_of_measure_id,
            "display_order": rm.display_order,
            "created_at": rm.created_at,
            "updated_at": rm.updated_at,
            "material_name": rm.material.name if rm.material else None,
            "material_code": rm.material.code if rm.material else None,
            "unit_of_measure_name": rm.unit_of_measure.abbreviation if rm.unit_of_measure else None,
        })
    return result


@router.post("/{product_id}/recipe-materials", response_model=RecipeMaterialResponse, status_code=status.HTTP_201_CREATED)
async def create_product_recipe_material(
    product_id: int,
    material_data: RecipeMaterialCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a recipe material for a product."""
    # Verify product exists and is prepared
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    if product.product_type.value != "prepared":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product must be of type 'prepared' to have recipe materials"
        )
    
    # Get or create recipe
    recipe = db.query(Recipe).filter(Recipe.product_id == product_id).first()
    if not recipe:
        recipe = Recipe(
            product_id=product_id,
            name=f"Recipe for {product.name}",
            yield_quantity=Decimal("1.0"),
            is_active=True
        )
        db.add(recipe)
        db.commit()
        db.refresh(recipe)
    
    # Verify material exists
    material = db.query(Material).filter(Material.id == material_data.material_id).first()
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material not found"
        )
    
    # Check if material already exists in recipe
    existing = db.query(RecipeMaterial).filter(
        RecipeMaterial.recipe_id == recipe.id,
        RecipeMaterial.material_id == material_data.material_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This material already exists in the recipe"
        )
    
    # Create recipe material
    recipe_material = RecipeMaterial(
        recipe_id=recipe.id,
        material_id=material_data.material_id,
        quantity=material_data.quantity,
        unit_of_measure_id=material_data.unit_of_measure_id,
    )
    db.add(recipe_material)
    db.commit()
    db.refresh(recipe_material)
    
    # Reload with relationships
    recipe_material = db.query(RecipeMaterial).options(
        joinedload(RecipeMaterial.material),
        joinedload(RecipeMaterial.unit_of_measure)
    ).filter(RecipeMaterial.id == recipe_material.id).first()
    
    return {
        "id": recipe_material.id,
        "recipe_id": recipe_material.recipe_id,
        "material_id": recipe_material.material_id,
        "quantity": float(recipe_material.quantity) if recipe_material.quantity is not None else None,
        "unit_of_measure_id": recipe_material.unit_of_measure_id,
        "display_order": recipe_material.display_order,
        "created_at": recipe_material.created_at,
        "updated_at": recipe_material.updated_at,
        "material_name": recipe_material.material.name if recipe_material.material else None,
        "material_code": recipe_material.material.code if recipe_material.material else None,
        "unit_of_measure_name": recipe_material.unit_of_measure.abbreviation if recipe_material.unit_of_measure else None,
    }


@router.put("/{product_id}/recipe-materials/{material_id}", response_model=RecipeMaterialResponse)
async def update_product_recipe_material(
    product_id: int,
    material_id: int,
    material_data: RecipeMaterialUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a recipe material for a product."""
    # Verify product exists
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Get recipe
    recipe = db.query(Recipe).filter(Recipe.product_id == product_id).first()
    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipe not found for this product"
        )
    
    # Get recipe material
    recipe_material = db.query(RecipeMaterial).filter(
        RecipeMaterial.id == material_id,
        RecipeMaterial.recipe_id == recipe.id
    ).first()
    if not recipe_material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipe material not found"
        )
    
    # Update fields
    update_data = material_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(recipe_material, field, value)
    
    db.commit()
    db.refresh(recipe_material)
    
    # Reload with relationships
    recipe_material = db.query(RecipeMaterial).options(
        joinedload(RecipeMaterial.material),
        joinedload(RecipeMaterial.unit_of_measure)
    ).filter(RecipeMaterial.id == material_id).first()
    
    return {
        "id": recipe_material.id,
        "recipe_id": recipe_material.recipe_id,
        "material_id": recipe_material.material_id,
        "quantity": float(recipe_material.quantity) if recipe_material.quantity is not None else None,
        "unit_of_measure_id": recipe_material.unit_of_measure_id,
        "display_order": recipe_material.display_order,
        "created_at": recipe_material.created_at,
        "updated_at": recipe_material.updated_at,
        "material_name": recipe_material.material.name if recipe_material.material else None,
        "material_code": recipe_material.material.code if recipe_material.material else None,
        "unit_of_measure_name": recipe_material.unit_of_measure.abbreviation if recipe_material.unit_of_measure else None,
    }


@router.delete("/{product_id}/recipe-materials/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product_recipe_material(
    product_id: int,
    material_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a recipe material from a product."""
    # Verify product exists
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Get recipe
    recipe = db.query(Recipe).filter(Recipe.product_id == product_id).first()
    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipe not found for this product"
        )
    
    # Get recipe material
    recipe_material = db.query(RecipeMaterial).filter(
        RecipeMaterial.id == material_id,
        RecipeMaterial.recipe_id == recipe.id
    ).first()
    if not recipe_material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipe material not found"
        )
    
    db.delete(recipe_material)
    db.commit()
    return None


# Kit Components endpoints (nested under products)
@router.get("/{product_id}/kit-components", response_model=List[dict])
async def list_product_kit_components(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all kit components for a product."""
    # Verify product exists and is a kit
    product = db.query(Product).filter(Product.id == product_id).first()
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
    
    # Get kit components
    components = db.query(KitComponent).options(
        joinedload(KitComponent.component)
    ).filter(KitComponent.product_id == product_id).all()
    
    result = []
    for component in components:
        result.append({
            "id": component.id,
            "product_id": component.product_id,
            "component_id": component.component_id,
            "quantity": float(component.quantity),
            "created_at": component.created_at.isoformat() if component.created_at else None,
            "updated_at": component.updated_at.isoformat() if component.updated_at else None,
            "component_name": component.component.name if component.component else None,
            "component_code": component.component.code if component.component else None,
        })
    return result


# Store Product Prices endpoints (nested under products)
@router.get("/{product_id}/store-prices", response_model=List[dict])
async def list_product_store_prices(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all store prices for a product."""
    from app.models import Setting
    
    # Verify product exists
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Get store prices
    prices = db.query(StoreProductPrice).options(
        joinedload(StoreProductPrice.store)
    ).filter(StoreProductPrice.product_id == product_id).all()
    
    result = []
    for price in prices:
        result.append({
            "id": price.id,
            "store_id": price.store_id,
            "product_id": price.product_id,
            "selling_price": float(price.selling_price) if price.selling_price is not None else None,
            "created_at": price.created_at.isoformat() if price.created_at else None,
            "updated_at": price.updated_at.isoformat() if price.updated_at else None,
            "store_name": price.store.name if price.store else None,
        })
    return result


# Store Product Groups endpoints (nested under products)
@router.get("/{product_id}/groups", response_model=List[dict])
async def list_product_groups(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all store groups that a product belongs to."""
    # Verify product exists
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Get all groups the product belongs to
    # Use the many-to-many relationship through the association table
    from app.models.product import product_group_table
    groups = db.query(StoreProductGroup).options(
        joinedload(StoreProductGroup.store)
    ).join(
        product_group_table
    ).filter(
        product_group_table.c.product_id == product_id
    ).all()
    
    result = []
    for group in groups:
        result.append({
            "id": group.id,
            "store_id": group.store_id,
            "group_name": group.group_name,
            "store_name": group.store.name if group.store else None,
            "created_at": group.created_at.isoformat() if group.created_at else None,
            "updated_at": group.updated_at.isoformat() if group.updated_at else None,
        })
    return result


@router.post("/{product_id}/groups", status_code=status.HTTP_204_NO_CONTENT)
async def assign_product_to_group(
    product_id: int,
    assignment: ProductGroupAssignment,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Assign or unassign a product to/from a store group."""
    # Verify product exists
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Verify group exists
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

