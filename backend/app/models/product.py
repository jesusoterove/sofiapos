"""
Product, Material, Recipe, and related models for product management.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Numeric, Text, Table, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

# Association table for many-to-many relationship between products and tags
product_tag_table = Table(
    "product_product_tags",  # Association table name
    Base.metadata,
    Column("product_id", Integer, ForeignKey("products.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("product_tags.id", ondelete="CASCADE"), primary_key=True),
)

# Association table for many-to-many relationship between products and store product groups
product_group_table = Table(
    "product_store_product_groups",  # Association table name
    Base.metadata,
    Column("product_id", Integer, ForeignKey("products.id", ondelete="CASCADE"), primary_key=True),
    Column("group_id", Integer, ForeignKey("store_product_groups.id", ondelete="CASCADE"), primary_key=True),
)


class ProductType(str, enum.Enum):
    """Product type enumeration."""
    SALES_INVENTORY = "sales_inventory"
    PREPARED = "prepared"
    KIT = "kit"
    SERVICE = "service"
    MISC_CHARGES = "misc_charges"


class Product(Base):
    """Product model for sellable items."""
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    code = Column(String(100), nullable=True, index=True)  # SKU or barcode
    description = Column(Text)
    category_id = Column(Integer, ForeignKey("product_categories.id", ondelete="SET NULL"), nullable=True)
    product_type = Column(Enum(ProductType), nullable=False, default=ProductType.SALES_INVENTORY)
    is_active = Column(Boolean, default=True, nullable=False)
    selling_price = Column(Numeric(10, 2), nullable=False, default=0.0)  # Default selling price
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    category = relationship("ProductCategory", back_populates="products")
    tags = relationship("ProductTag", secondary=product_tag_table, back_populates="products")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")
    unit_of_measures = relationship("ProductUnitOfMeasure", back_populates="product", cascade="all, delete-orphan")
    taxes = relationship("ProductTax", back_populates="product", cascade="all, delete-orphan")
    discounts = relationship("ProductDiscount", back_populates="product", cascade="all, delete-orphan")
    recipes = relationship("Recipe", back_populates="product", cascade="all, delete-orphan")
    order_items = relationship("OrderItem", back_populates="product")
    store_groups = relationship("StoreProductGroup", secondary=product_group_table, back_populates="products")
    kit_components = relationship("KitComponent", foreign_keys="KitComponent.product_id", back_populates="product", cascade="all, delete-orphan")
    component_of = relationship("KitComponent", foreign_keys="KitComponent.component_id", back_populates="component", cascade="all, delete-orphan")
    store_prices = relationship("StoreProductPrice", back_populates="product", cascade="all, delete-orphan")
    inventory_config = relationship("InventoryControlConfig", back_populates="product", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Product(id={self.id}, name='{self.name}', code='{self.code}')>"


class Material(Base):
    """Material model for ingredients and raw materials."""
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    code = Column(String(100), nullable=True, index=True)
    description = Column(Text)
    requires_inventory = Column(Boolean, default=True, nullable=False)
    base_uofm_id = Column(Integer, ForeignKey("unit_of_measures.id", ondelete="SET NULL"), nullable=True)
    unit_cost = Column(Numeric(10, 4), nullable=True)  # Cost per base unit
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    base_uofm = relationship("UnitOfMeasure", foreign_keys=[base_uofm_id])
    unit_of_measures = relationship("MaterialUnitOfMeasure", back_populates="material", cascade="all, delete-orphan")
    recipe_materials = relationship("RecipeMaterial", back_populates="material")
    inventory_config = relationship("InventoryControlConfig", back_populates="material", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Material(id={self.id}, name='{self.name}', code='{self.code}')>"


class MaterialUnitOfMeasure(Base):
    """Material unit of measure for inventory tracking (up to 3 units per material)."""
    __tablename__ = "material_unit_of_measures"

    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("materials.id", ondelete="CASCADE"), nullable=False, index=True)
    unit_of_measure_id = Column(Integer, ForeignKey("unit_of_measures.id", ondelete="CASCADE"), nullable=False)
    conversion_factor = Column(Numeric(10, 4), nullable=False, default=1.0)  # Conversion to base unit
    is_base_unit = Column(Boolean, default=False, nullable=False)
    display_order = Column(Integer, default=0, nullable=False)  # For ordering (1-3)

    # Relationships
    material = relationship("Material", back_populates="unit_of_measures")
    unit_of_measure = relationship("UnitOfMeasure")

    def __repr__(self):
        return f"<MaterialUnitOfMeasure(material_id={self.material_id}, unit_of_measure_id={self.unit_of_measure_id})>"


class Recipe(Base):
    """Recipe model linking products to materials."""
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    yield_quantity = Column(Numeric(10, 4), nullable=False, default=1.0)  # How many products this recipe makes
    yield_unit_of_measure_id = Column(Integer, ForeignKey("unit_of_measures.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    product = relationship("Product", back_populates="recipes")
    yield_unit_of_measure = relationship("UnitOfMeasure")
    materials = relationship("RecipeMaterial", back_populates="recipe", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Recipe(id={self.id}, product_id={self.product_id}, name='{self.name}')>"


class RecipeMaterial(Base):
    """Association table for recipe materials with quantities."""
    __tablename__ = "recipe_materials"

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False, index=True)
    material_id = Column(Integer, ForeignKey("materials.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Numeric(10, 4), nullable=False)
    unit_of_measure_id = Column(Integer, ForeignKey("unit_of_measures.id", ondelete="SET NULL"), nullable=True)
    display_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    recipe = relationship("Recipe", back_populates="materials")
    material = relationship("Material", back_populates="recipe_materials")
    unit_of_measure = relationship("UnitOfMeasure")

    def __repr__(self):
        return f"<RecipeMaterial(recipe_id={self.recipe_id}, material_id={self.material_id}, quantity={self.quantity})>"


class ProductCategory(Base):
    """Product category model."""
    __tablename__ = "product_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    parent_id = Column(Integer, ForeignKey("product_categories.id", ondelete="SET NULL"), nullable=True)
    display_order = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    products = relationship("Product", back_populates="category")
    parent = relationship("ProductCategory", remote_side=[id], backref="children")

    def __repr__(self):
        return f"<ProductCategory(id={self.id}, name='{self.name}')>"


class ProductTag(Base):
    """Product tag model for flexible product organization."""
    __tablename__ = "product_tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    color = Column(String(7), nullable=True)  # Hex color code
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    products = relationship("Product", secondary=product_tag_table, back_populates="tags")

    def __repr__(self):
        return f"<ProductTag(id={self.id}, name='{self.name}')>"


class ProductImage(Base):
    """Product image model."""
    __tablename__ = "product_images"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    image_url = Column(String(500), nullable=False)
    image_path = Column(String(500), nullable=True)  # Local file path
    is_primary = Column(Boolean, default=False, nullable=False)
    display_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    product = relationship("Product", back_populates="images")

    def __repr__(self):
        return f"<ProductImage(id={self.id}, product_id={self.product_id}, is_primary={self.is_primary})>"


class UnitOfMeasure(Base):
    """Unit of measure model (e.g., kg, lb, piece, box)."""
    __tablename__ = "unit_of_measures"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    abbreviation = Column(String(20), unique=True, nullable=False)
    type = Column(String(50), nullable=False)  # weight, volume, piece, etc.
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<UnitOfMeasure(id={self.id}, name='{self.name}', abbreviation='{self.abbreviation}')>"


class ProductUnitOfMeasure(Base):
    """Product unit of measure for selling (up to 3 units per product)."""
    __tablename__ = "product_unit_of_measures"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    unit_of_measure_id = Column(Integer, ForeignKey("unit_of_measures.id", ondelete="CASCADE"), nullable=False)
    conversion_factor = Column(Numeric(10, 4), nullable=False, default=1.0)  # Conversion to base unit
    is_base_unit = Column(Boolean, default=False, nullable=False)
    display_order = Column(Integer, default=0, nullable=False)  # For ordering (1-3)

    # Relationships
    product = relationship("Product", back_populates="unit_of_measures")
    unit_of_measure = relationship("UnitOfMeasure")

    def __repr__(self):
        return f"<ProductUnitOfMeasure(product_id={self.product_id}, unit_of_measure_id={self.unit_of_measure_id})>"


class StoreProductGroup(Base):
    """Store product group model for organizing products by store."""
    __tablename__ = "store_product_groups"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id", ondelete="CASCADE"), nullable=False, index=True)
    group_name = Column(String(255), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    store = relationship("Store", back_populates="product_groups")
    products = relationship("Product", secondary=product_group_table, back_populates="store_groups")

    def __repr__(self):
        return f"<StoreProductGroup(id={self.id}, store_id={self.store_id}, group_name='{self.group_name}')>"


class KitComponent(Base):
    """Kit component model for product bundles."""
    __tablename__ = "kit_components"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)  # Kit product
    component_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)  # Component product
    quantity = Column(Numeric(10, 4), nullable=False, default=1.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    product = relationship("Product", foreign_keys=[product_id], back_populates="kit_components")
    component = relationship("Product", foreign_keys=[component_id], back_populates="component_of")

    def __repr__(self):
        return f"<KitComponent(product_id={self.product_id}, component_id={self.component_id}, quantity={self.quantity})>"


class StoreProductPrice(Base):
    """Store-specific product price model."""
    __tablename__ = "store_product_prices"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    selling_price = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    store = relationship("Store", back_populates="product_prices")
    product = relationship("Product", back_populates="store_prices")

    def __repr__(self):
        return f"<StoreProductPrice(store_id={self.store_id}, product_id={self.product_id}, selling_price={self.selling_price})>"

