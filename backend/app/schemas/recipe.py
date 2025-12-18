"""
Recipe schemas for API requests and responses.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.schemas.recipe_material import RecipeMaterialResponse


class RecipeBase(BaseModel):
    """Base recipe schema with common fields."""
    product_id: int = Field(..., description="Product ID")
    name: str = Field(..., min_length=1, max_length=255, description="Recipe name")
    description: Optional[str] = Field(None, description="Recipe description")
    yield_quantity: float = Field(..., gt=0, description="How many products this recipe makes")
    yield_unit_of_measure_id: Optional[int] = Field(None, description="Unit of measure for yield")
    is_active: bool = Field(True, description="Whether the recipe is active")


class RecipeCreate(RecipeBase):
    """Schema for creating a new recipe."""
    pass


class RecipeUpdate(BaseModel):
    """Schema for updating a recipe."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    yield_quantity: Optional[float] = Field(None, gt=0)
    yield_unit_of_measure_id: Optional[int] = None
    is_active: Optional[bool] = None


class RecipeResponse(BaseModel):
    """Schema for recipe response."""
    id: int
    product_id: int
    name: str
    description: Optional[str] = None
    yield_quantity: float
    yield_unit_of_measure_id: Optional[int] = None
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    materials: Optional[List[RecipeMaterialResponse]] = None

    class Config:
        from_attributes = True

