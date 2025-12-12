"""
Database reset script.
WARNING: This script will DELETE ALL DATA and recreate the database schema.
This script should be used MANUALLY ONLY and is intended for development/testing purposes.

Usage:
    python -m app.scripts.reset_db
"""
import sys
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.scripts.init_db import init_db
from app.scripts.force_create_admin import force_create_admin_user
from app.models import Store, StoreProductGroup, Material, UnitOfMeasure
from app.services.store_service import ensure_store_tables


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


def create_default_ingredients(db: Session):
    """Create default ingredients (materials)."""
    # Get GR unit of measure
    gr_uofm = db.query(UnitOfMeasure).filter(UnitOfMeasure.abbreviation == "GR").first()
    if not gr_uofm:
        print("⚠ Warning: GR unit of measure not found. Please create it first.")
        return
    
    ingredients = [
        {
            "code": "MOJE",
            "name": "MOJE",
            "base_uofm_id": gr_uofm.id,
            "unit_cost": 10.00,
            "requires_inventory": True,
        },
        {
            "code": "MOZZARELLA",
            "name": "QUESO MOZZARELLA",
            "base_uofm_id": gr_uofm.id,
            "unit_cost": 20.00,
            "requires_inventory": True,
        },
    ]
    
    created_count = 0
    for ingredient_data in ingredients:
        existing = db.query(Material).filter(Material.code == ingredient_data["code"]).first()
        if not existing:
            material = Material(**ingredient_data)
            db.add(material)
            created_count += 1
    
    if created_count > 0:
        db.commit()
        print(f"✓ {created_count} default ingredients created")
    else:
        print("✓ Default ingredients already exist")


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
    try:
        # Drop all tables
        Base.metadata.drop_all(bind=engine)
        print("✓ All tables dropped")
        
        # Reinitialize database
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
        
        # Create default store and ingredients
        print("\nCreating default store and ingredients...")
        db = SessionLocal()
        try:
            create_default_store(db)
            create_default_ingredients(db)
            # Refresh bookmark groups to include the new store
            from app.scripts.init_db import create_bookmark_groups_for_stores
            create_bookmark_groups_for_stores(db)
        finally:
            db.close()
        
        print("\n" + "=" * 60)
        print("✓ Database reset completed successfully!")
        print("=" * 60)
    except Exception as e:
        print(f"\n✗ Error during reset: {e}")
        raise


if __name__ == "__main__":
    reset_db()

