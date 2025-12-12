"""
Database initialization script from JSON file.
Resets the database and loads data from data/initialize.json.

WARNING: This script will DELETE ALL DATA and recreate the database schema.

Usage:
    python -m app.scripts.initialize_from_json
    python -m app.scripts.initialize_from_json --json-path /path/to/initialize.json
"""
import sys
import json
import argparse
from pathlib import Path
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import SessionLocal, engine, Base
from app.scripts.init_db import init_db
from app.scripts.force_create_admin import force_create_admin_user
from app.models import (
    UnitOfMeasure, ProductCategory, Product, Material,
    ProductUnitOfMeasure, MaterialUnitOfMeasure,
    Recipe, RecipeMaterial, InventoryControlConfig, Store
)
from app.services.store_service import ensure_store_tables


def load_json_data(json_path: Path) -> dict:
    """Load data from JSON file."""
    if not json_path.exists():
        raise FileNotFoundError(f"JSON file not found: {json_path}")
    
    with open(json_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def create_default_store(db: Session):
    """Create default store."""
    existing = db.query(Store).filter(Store.code == "ARA-001").first()
    if not existing:
        store = Store(
            name="ARA San Cristobal",
            code="ARA-001",
            email="blocosmanager@gmail.com",
            is_active=True
        )
        db.add(store)
        db.commit()
        db.refresh(store)
        print("✓ Default store created")
        
        # Ensure tables exist for the default store
        ensure_store_tables(db, store.id, store.default_tables_count)
        db.commit()
        print(f"✓ {store.default_tables_count} default tables created for store")
        
        return store
    else:
        print("✓ Default store already exists")
        # Ensure tables exist even if store already exists (in case tables were deleted)
        ensure_store_tables(db, existing.id, existing.default_tables_count)
        db.commit()
        return existing


def reset_db():
    """Reset the database by dropping all tables and reinitializing."""
    print("=" * 60)
    print("WARNING: This will DELETE ALL DATA in the database!")
    print("=" * 60)
    
    # Safety check - require confirmation
    response = input("\nAre you sure you want to reset the database? Type 'YES' to continue: ")
    if response != "YES":
        print("Reset cancelled.")
        sys.exit(0)
    
    print("\nDropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("✓ All tables dropped")
    
    # Reinitialize database (creates tables and default data)
    print("\nReinitializing database...")
    init_db()
    
    # Create admin user
    print("\nCreating admin user...")
    db = SessionLocal()
    try:
        created, message = force_create_admin_user(db)
        if created:
            print(f"✓ {message}")
        else:
            print(f"⚠ {message}")
    finally:
        db.close()


def load_unit_of_measures(db: Session, data: list):
    """Load unit of measures from JSON data."""
    print(f"\nLoading {len(data)} unit of measures...")
    created_count = 0
    
    for item in data:
        # Check if already exists (by ID or abbreviation)
        existing = db.query(UnitOfMeasure).filter(
            (UnitOfMeasure.id == item['id']) | 
            (UnitOfMeasure.abbreviation == item['abbreviation'])
        ).first()
        
        if not existing:
            unit = UnitOfMeasure(
                id=item['id'],
                name=item['name'],
                abbreviation=item['abbreviation'],
                type=item['type'],
                is_active=item['is_active'],
                created_at=datetime.fromisoformat(item['created_at'].replace('Z', '+00:00')),
                updated_at=datetime.fromisoformat(item['updated_at'].replace('Z', '+00:00'))
            )
            db.add(unit)
            created_count += 1
    
    db.commit()
    print(f"✓ {created_count} unit of measures loaded")


def load_product_categories(db: Session, data: list):
    """Load product categories from JSON data."""
    print(f"\nLoading {len(data)} product categories...")
    created_count = 0
    
    for item in data:
        existing = db.query(ProductCategory).filter(ProductCategory.id == item['id']).first()
        if not existing:
            category = ProductCategory(
                id=item['id'],
                name=item['name'],
                description=item.get('description'),
                created_at=datetime.fromisoformat(item['created_at'].replace('Z', '+00:00')),
                updated_at=datetime.fromisoformat(item['updated_at'].replace('Z', '+00:00'))
            )
            db.add(category)
            created_count += 1
    
    db.commit()
    print(f"✓ {created_count} product categories loaded")


def load_products(db: Session, data: list):
    """Load products from JSON data."""
    print(f"\nLoading {len(data)} products...")
    created_count = 0
    
    for item in data:
        existing = db.query(Product).filter(Product.id == item['id']).first()
        if not existing:
            # Set default code if empty: 'P-{id}' with zero padding to 4 digits
            code = item.get('code')
            if not code or code.strip() == '':
                code = f"P-{item['id']:04d}"
            
            product = Product(
                id=item['id'],
                name=item['name'],
                code=code,
                description=item.get('description'),
                category_id=item.get('category_id'),
                product_type=item['product_type'],
                is_active=item['is_active'],
                selling_price=item['selling_price'],
                created_at=datetime.fromisoformat(item['created_at'].replace('Z', '+00:00')),
                updated_at=datetime.fromisoformat(item['updated_at'].replace('Z', '+00:00'))
            )
            db.add(product)
            created_count += 1
    
    db.commit()
    print(f"✓ {created_count} products loaded")


def load_materials(db: Session, data: list):
    """Load materials from JSON data."""
    print(f"\nLoading {len(data)} materials...")
    created_count = 0
    
    for item in data:
        existing = db.query(Material).filter(Material.id == item['id']).first()
        if not existing:
            # Set default code if empty: 'I-{id}' with zero padding to 4 digits
            code = item.get('code')
            if not code or code.strip() == '':
                code = f"I-{item['id']:04d}"
            
            material = Material(
                id=item['id'],
                name=item['name'],
                code=code,
                description=item.get('description'),
                requires_inventory=item['requires_inventory'],
                base_uofm_id=item['base_uofm_id'],
                unit_cost=item['unit_cost'],
                created_at=datetime.fromisoformat(item['created_at'].replace('Z', '+00:00')),
                updated_at=datetime.fromisoformat(item['updated_at'].replace('Z', '+00:00'))
            )
            db.add(material)
            created_count += 1
    
    db.commit()
    print(f"✓ {created_count} materials loaded")


def load_product_unit_of_measures(db: Session, data: list):
    """Load product unit of measure relationships from JSON data."""
    print(f"\nLoading {len(data)} product unit of measure relationships...")
    created_count = 0
    
    for item in data:
        # Skip if id is None (these are association records)
        if item.get('id') is not None:
            existing = db.query(ProductUnitOfMeasure).filter(
                ProductUnitOfMeasure.id == item['id']
            ).first()
            if existing:
                continue
        
        # Check if relationship already exists
        existing = db.query(ProductUnitOfMeasure).filter(
            ProductUnitOfMeasure.product_id == item['product_id'],
            ProductUnitOfMeasure.unit_of_measure_id == item['unit_of_measure_id']
        ).first()
        
        if not existing:
            puom = ProductUnitOfMeasure(
                product_id=item['product_id'],
                unit_of_measure_id=item['unit_of_measure_id'],
                conversion_factor=item['conversion_factor'],
                is_base_unit=item['is_base_unit'],
                display_order=item.get('display_order', 1)
            )
            db.add(puom)
            created_count += 1
    
    db.commit()
    print(f"✓ {created_count} product unit of measure relationships loaded")


def load_material_unit_of_measures(db: Session, data: list):
    """Load material unit of measure relationships from JSON data."""
    print(f"\nLoading {len(data)} material unit of measure relationships...")
    created_count = 0
    
    for item in data:
        # Skip if id is None
        if item.get('id') is not None:
            existing = db.query(MaterialUnitOfMeasure).filter(
                MaterialUnitOfMeasure.id == item['id']
            ).first()
            if existing:
                continue
        
        # Check if relationship already exists
        existing = db.query(MaterialUnitOfMeasure).filter(
            MaterialUnitOfMeasure.material_id == item['material_id'],
            MaterialUnitOfMeasure.unit_of_measure_id == item['unit_of_measure_id']
        ).first()
        
        if not existing:
            muom = MaterialUnitOfMeasure(
                material_id=item['material_id'],
                unit_of_measure_id=item['unit_of_measure_id'],
                conversion_factor=item['conversion_factor'],
                is_base_unit=item['is_base_unit'],
                display_order=item.get('display_order', 1)
            )
            db.add(muom)
            created_count += 1
    
    db.commit()
    print(f"✓ {created_count} material unit of measure relationships loaded")


def load_recipes(db: Session, data: list):
    """Load recipes from JSON data."""
    print(f"\nLoading {len(data)} recipes...")
    created_count = 0
    
    for item in data:
        existing = db.query(Recipe).filter(Recipe.id == item['id']).first()
        if not existing:
            recipe = Recipe(
                id=item['id'],
                product_id=item['product_id'],
                name=item['name'],
                description=item.get('description'),
                yield_quantity=item['yield_quantity'],
                yield_unit_of_measure_id=item['yield_unit_of_measure_id'],
                is_active=item['is_active'],
                created_at=datetime.fromisoformat(item['created_at'].replace('Z', '+00:00')),
                updated_at=datetime.fromisoformat(item['updated_at'].replace('Z', '+00:00'))
            )
            db.add(recipe)
            created_count += 1
    
    db.commit()
    print(f"✓ {created_count} recipes loaded")


def load_recipe_materials(db: Session, data: list):
    """Load recipe materials from JSON data."""
    print(f"\nLoading {len(data)} recipe materials...")
    created_count = 0
    
    for item in data:
        # Skip if id is None
        if item.get('id') is not None:
            existing = db.query(RecipeMaterial).filter(
                RecipeMaterial.id == item['id']
            ).first()
            if existing:
                continue
        
        # Check if relationship already exists
        existing = db.query(RecipeMaterial).filter(
            RecipeMaterial.recipe_id == item['recipe_id'],
            RecipeMaterial.material_id == item['material_id'],
            RecipeMaterial.unit_of_measure_id == item['unit_of_measure_id']
        ).first()
        
        if not existing:
            rm = RecipeMaterial(
                recipe_id=item['recipe_id'],
                material_id=item['material_id'],
                quantity=item['quantity'],
                unit_of_measure_id=item['unit_of_measure_id'],
                display_order=item.get('display_order', 1)
            )
            db.add(rm)
            created_count += 1
    
    db.commit()
    print(f"✓ {created_count} recipe materials loaded")


def load_inventory_control_config(db: Session, data: list):
    """Load inventory control config from JSON data.
    
    Note: The JSON has uofm1, uofm2, uofm3 as abbreviations (strings),
    but the model expects uofm1_id, uofm2_id, uofm3_id as integers (FKs).
    """
    print(f"\nLoading {len(data)} inventory control config entries...")
    
    # Create mapping from abbreviation to ID
    uofm_map = {}
    for uofm in db.query(UnitOfMeasure).all():
        uofm_map[uofm.abbreviation] = uofm.id
    
    created_count = 0
    
    for item in data:
        # Convert uofm abbreviations to IDs
        uofm1_id = None
        uofm2_id = None
        uofm3_id = None
        
        if item.get('uofm1'):
            uofm1_id = uofm_map.get(item['uofm1'])
            if not uofm1_id:
                print(f"⚠ Warning: Unit of measure '{item['uofm1']}' not found for uofm1")
        
        if item.get('uofm2'):
            uofm2_id = uofm_map.get(item['uofm2'])
            if not uofm2_id:
                print(f"⚠ Warning: Unit of measure '{item['uofm2']}' not found for uofm2")
        
        if item.get('uofm3'):
            uofm3_id = uofm_map.get(item['uofm3'])
            if not uofm3_id:
                print(f"⚠ Warning: Unit of measure '{item['uofm3']}' not found for uofm3")
        
        # Check if config already exists
        existing = db.query(InventoryControlConfig).filter(
            InventoryControlConfig.item_type == item['item_type'],
            InventoryControlConfig.product_id == item.get('product_id'),
            InventoryControlConfig.material_id == item.get('material_id')
        ).first()
        
        if not existing:
            config = InventoryControlConfig(
                item_type=item['item_type'],
                product_id=item.get('product_id'),
                material_id=item.get('material_id'),
                show_in_inventory=item['show_in_inventory'],
                priority=item['priority'],
                uofm1_id=uofm1_id,
                uofm2_id=uofm2_id,
                uofm3_id=uofm3_id
            )
            db.add(config)
            created_count += 1
    
    db.commit()
    print(f"✓ {created_count} inventory control config entries loaded")


def reset_sequences(db: Session):
    """Reset PostgreSQL sequences after inserting data with explicit IDs."""
    try:
        # Get database type from engine
        db_type = str(engine.url).split('+')[0]
        
        if db_type == 'postgresql':
            # Reset sequences for tables with explicit IDs
            tables = [
                'unit_of_measures', 'product_categories', 'products', 'materials',
                'recipes', 'inventory_control_config'
            ]
            
            for table in tables:
                try:
                    # Get max ID from table
                    result = db.execute(text(f"SELECT COALESCE(MAX(id), 0) FROM {table}"))
                    max_id = result.scalar() or 0
                    
                    if max_id > 0:
                        # Try to find and reset the sequence
                        # First, try the standard naming convention
                        seq_name = f"{table}_id_seq"
                        # Check if sequence exists
                        seq_check = db.execute(text(
                            f"SELECT EXISTS(SELECT 1 FROM pg_class WHERE relname = '{seq_name}')"
                        ))
                        if seq_check.scalar():
                            # Reset sequence to max_id + 1
                            db.execute(text(f"SELECT setval('{seq_name}', {max_id + 1}, false)"))
                except Exception as e:
                    # If sequence reset fails for one table, continue with others
                    print(f"⚠ Warning: Could not reset sequence for {table}: {e}")
            
            db.commit()
            print("✓ PostgreSQL sequences reset")
    except Exception as e:
        # If sequence reset fails, it's not critical - just log it
        print(f"⚠ Warning: Could not reset sequences: {e}")


def initialize_from_json(json_path: Path):
    """Main function to reset database and load data from JSON."""
    print("=" * 60)
    print("Database Initialization from JSON")
    print("=" * 60)
    
    # Reset database
    reset_db()
    
    # Load JSON data
    print(f"\nLoading data from: {json_path}")
    data = load_json_data(json_path)
    
    # Load data in correct order (respecting foreign key constraints)
    db = SessionLocal()
    # Create default store
    create_default_store(db)
    try:
        # 1. Unit of measures (no dependencies)
        if 'unit_of_measures' in data:
            load_unit_of_measures(db, data['unit_of_measures'])
        
        # 2. Product categories (no dependencies)
        if 'product_categories' in data:
            load_product_categories(db, data['product_categories'])
        
        # 3. Products (depends on product_categories)
        if 'products' in data:
            load_products(db, data['products'])
        
        # 4. Materials (depends on unit_of_measures)
        if 'materials' in data:
            load_materials(db, data['materials'])
        
        # 5. Product unit of measures (depends on products and unit_of_measures)
        if 'product_unit_of_measures' in data:
            load_product_unit_of_measures(db, data['product_unit_of_measures'])
        
        # 6. Material unit of measures (depends on materials and unit_of_measures)
        if 'material_unit_of_measures' in data:
            load_material_unit_of_measures(db, data['material_unit_of_measures'])
        
        # 7. Recipes (depends on products and unit_of_measures)
        if 'recipes' in data:
            load_recipes(db, data['recipes'])
        
        # 8. Recipe materials (depends on recipes, materials, and unit_of_measures)
        if 'recipe_materials' in data:
            load_recipe_materials(db, data['recipe_materials'])
        
        # 9. Inventory control config (depends on products, materials, and unit_of_measures)
        if 'inventory_control_config' in data:
            load_inventory_control_config(db, data['inventory_control_config'])
        
        # Reset sequences for PostgreSQL (if needed)
        reset_sequences(db)
        
        print("\n" + "=" * 60)
        print("✓ Database initialization from JSON completed successfully!")
        print("=" * 60)
        
    except Exception as e:
        db.rollback()
        print(f"\n✗ Error during initialization: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description='Initialize database from JSON file')
    parser.add_argument(
        '--json-path',
        type=str,
        default=None,
        help='Path to JSON file (default: data/initialize.json relative to project root)'
    )
    
    args = parser.parse_args()
    
    # Determine JSON file path
    if args.json_path:
        json_path = Path(args.json_path)
    else:
        # Default to data/initialize.json in project root
        script_dir = Path(__file__).parent.parent.parent
        json_path = script_dir / 'data' / 'initialize.json'
    
    if not json_path.exists():
        print(f"Error: JSON file not found: {json_path}")
        print(f"Please provide a valid path using --json-path")
        sys.exit(1)
    
    initialize_from_json(json_path)


if __name__ == "__main__":
    main()

