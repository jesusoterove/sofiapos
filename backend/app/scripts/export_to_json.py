"""
Database export script to JSON file.
Exports master data (products, materials, unit of measures, etc.) to JSON format
compatible with initialize_from_json.py script.

WARNING: This script exports master data only. It does NOT export:
- Sales/Orders
- Shifts
- Inventory entries/transactions
- Users
- Cash register histories

Usage:
    python -m app.scripts.export_to_json
    python -m app.scripts.export_to_json --output-path /path/to/export.json
"""
import sys
import json
import argparse
from pathlib import Path
from datetime import datetime
from decimal import Decimal
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import (
    UnitOfMeasure, ProductCategory, Product, Material,
    ProductUnitOfMeasure, MaterialUnitOfMeasure,
    Recipe, RecipeMaterial, InventoryControlConfig,
    Store, Customer
)


class DateTimeEncoder(json.JSONEncoder):
    """Custom JSON encoder for datetime and Decimal objects."""
    def default(self, obj):
        if isinstance(obj, datetime):
            # Convert to ISO format with 'Z' suffix
            return obj.isoformat().replace('+00:00', 'Z')
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)


def serialize_datetime(dt):
    """Serialize datetime to ISO format string."""
    if dt is None:
        return None
    return dt.isoformat().replace('+00:00', 'Z')


def serialize_decimal(value):
    """Serialize Decimal to float."""
    if value is None:
        return None
    return float(value)


def export_unit_of_measures(db: Session) -> list:
    """Export unit of measures."""
    units = db.query(UnitOfMeasure).order_by(UnitOfMeasure.id).all()
    return [
        {
            'id': u.id,
            'name': u.name,
            'abbreviation': u.abbreviation,
            'type': u.type,
            'is_active': u.is_active,
            'created_at': serialize_datetime(u.created_at),
            'updated_at': serialize_datetime(u.updated_at),
        }
        for u in units
    ]


def export_product_categories(db: Session) -> list:
    """Export product categories."""
    categories = db.query(ProductCategory).order_by(ProductCategory.id).all()
    return [
        {
            'id': c.id,
            'name': c.name,
            'description': c.description,
            'created_at': serialize_datetime(c.created_at),
            'updated_at': serialize_datetime(c.updated_at),
        }
        for c in categories
    ]


def export_products(db: Session) -> list:
    """Export products."""
    products = db.query(Product).order_by(Product.id).all()
    return [
        {
            'id': p.id,
            'name': p.name,
            'code': p.code,
            'description': p.description,
            'category_id': p.category_id,
            'product_type': p.product_type.value if p.product_type else None,
            'is_active': p.is_active,
            'selling_price': serialize_decimal(p.selling_price),
            'created_at': serialize_datetime(p.created_at),
            'updated_at': serialize_datetime(p.updated_at),
        }
        for p in products
    ]


def export_materials(db: Session) -> list:
    """Export materials."""
    materials = db.query(Material).order_by(Material.id).all()
    return [
        {
            'id': m.id,
            'name': m.name,
            'code': m.code,
            'description': m.description,
            'requires_inventory': m.requires_inventory,
            'base_uofm_id': m.base_uofm_id,
            'unit_cost': serialize_decimal(m.unit_cost),
            'created_at': serialize_datetime(m.created_at),
            'updated_at': serialize_datetime(m.updated_at),
        }
        for m in materials
    ]


def export_product_unit_of_measures(db: Session) -> list:
    """Export product unit of measure relationships."""
    puoms = db.query(ProductUnitOfMeasure).order_by(
        ProductUnitOfMeasure.product_id,
        ProductUnitOfMeasure.display_order
    ).all()
    return [
        {
            'id': puom.id,
            'product_id': puom.product_id,
            'unit_of_measure_id': puom.unit_of_measure_id,
            'conversion_factor': serialize_decimal(puom.conversion_factor),
            'is_base_unit': puom.is_base_unit,
            'display_order': puom.display_order,
        }
        for puom in puoms
    ]


def export_material_unit_of_measures(db: Session) -> list:
    """Export material unit of measure relationships."""
    muoms = db.query(MaterialUnitOfMeasure).order_by(
        MaterialUnitOfMeasure.material_id,
        MaterialUnitOfMeasure.display_order
    ).all()
    return [
        {
            'id': muom.id,
            'material_id': muom.material_id,
            'unit_of_measure_id': muom.unit_of_measure_id,
            'conversion_factor': serialize_decimal(muom.conversion_factor),
            'is_base_unit': muom.is_base_unit,
            'display_order': muom.display_order,
        }
        for muom in muoms
    ]


def export_recipes(db: Session) -> list:
    """Export recipes."""
    recipes = db.query(Recipe).order_by(Recipe.id).all()
    return [
        {
            'id': r.id,
            'product_id': r.product_id,
            'name': r.name,
            'description': r.description,
            'yield_quantity': serialize_decimal(r.yield_quantity),
            'yield_unit_of_measure_id': r.yield_unit_of_measure_id,
            'is_active': r.is_active,
            'created_at': serialize_datetime(r.created_at),
            'updated_at': serialize_datetime(r.updated_at),
        }
        for r in recipes
    ]


def export_recipe_materials(db: Session) -> list:
    """Export recipe materials."""
    rms = db.query(RecipeMaterial).order_by(
        RecipeMaterial.recipe_id,
        RecipeMaterial.display_order
    ).all()
    return [
        {
            'id': rm.id,
            'recipe_id': rm.recipe_id,
            'material_id': rm.material_id,
            'quantity': serialize_decimal(rm.quantity),
            'unit_of_measure_id': rm.unit_of_measure_id,
            'display_order': rm.display_order,
        }
        for rm in rms
    ]


def export_inventory_control_config(db: Session) -> list:
    """Export inventory control config.
    
    Note: The initialize script expects uofm1, uofm2, uofm3 as abbreviations,
    but we export uofm1_id, uofm2_id, uofm3_id directly since we're exporting from DB.
    We'll need to convert IDs to abbreviations for compatibility.
    """
    configs = db.query(InventoryControlConfig).order_by(
        InventoryControlConfig.priority,
        InventoryControlConfig.id
    ).all()
    
    # Create mapping from ID to abbreviation
    uofm_map = {}
    for uofm in db.query(UnitOfMeasure).all():
        uofm_map[uofm.id] = uofm.abbreviation
    
    result = []
    for config in configs:
        item = {
            'item_type': config.item_type,
            'product_id': config.product_id,
            'material_id': config.material_id,
            'show_in_inventory': config.show_in_inventory,
            'priority': config.priority,
        }
        
        # Convert IDs to abbreviations for compatibility with initialize script
        if config.uofm1_id:
            item['uofm1'] = uofm_map.get(config.uofm1_id)
        if config.uofm2_id:
            item['uofm2'] = uofm_map.get(config.uofm2_id)
        if config.uofm3_id:
            item['uofm3'] = uofm_map.get(config.uofm3_id)
        
        result.append(item)
    
    return result


def export_stores(db: Session) -> list:
    """Export stores."""
    stores = db.query(Store).order_by(Store.id).all()
    return [
        {
            'id': s.id,
            'name': s.name,
            'code': s.code,
            'code_digits': s.code_digits,
            'address': s.address,
            'phone': s.phone,
            'email': s.email,
            'is_active': s.is_active,
            'default_tables_count': s.default_tables_count,
            'requires_start_inventory': s.requires_start_inventory,
            'requires_end_inventory': s.requires_end_inventory,
            'created_at': serialize_datetime(s.created_at),
            'updated_at': serialize_datetime(s.updated_at),
        }
        for s in stores
    ]


def export_customers(db: Session) -> list:
    """Export customers."""
    customers = db.query(Customer).order_by(Customer.id).all()
    return [
        {
            'id': c.id,
            'name': c.name,
            'code': c.code,
            'email': c.email,
            'phone': c.phone,
            'address': c.address,
            'tax_id': c.tax_id,
            'tax_id_type': c.tax_id_type,
            'credit_limit': serialize_decimal(c.credit_limit),
            'notes': c.notes,
            'is_active': c.is_active,
            'created_at': serialize_datetime(c.created_at),
            'updated_at': serialize_datetime(c.updated_at),
        }
        for c in customers
    ]


def export_to_json(output_path: Path):
    """Main function to export database to JSON."""
    print("=" * 60)
    print("Database Export to JSON")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        print("\nExporting master data...")
        
        # Export data in order (matching initialize script structure)
        export_data = {}
        
        # 1. Unit of measures
        print("Exporting unit of measures...")
        export_data['unit_of_measures'] = export_unit_of_measures(db)
        print(f"✓ Exported {len(export_data['unit_of_measures'])} unit of measures")
        
        # 2. Product categories
        print("Exporting product categories...")
        export_data['product_categories'] = export_product_categories(db)
        print(f"✓ Exported {len(export_data['product_categories'])} product categories")
        
        # 3. Products
        print("Exporting products...")
        export_data['products'] = export_products(db)
        print(f"✓ Exported {len(export_data['products'])} products")
        
        # 4. Materials
        print("Exporting materials...")
        export_data['materials'] = export_materials(db)
        print(f"✓ Exported {len(export_data['materials'])} materials")
        
        # 5. Product unit of measures
        print("Exporting product unit of measure relationships...")
        export_data['product_unit_of_measures'] = export_product_unit_of_measures(db)
        print(f"✓ Exported {len(export_data['product_unit_of_measures'])} product unit of measure relationships")
        
        # 6. Material unit of measures
        print("Exporting material unit of measure relationships...")
        export_data['material_unit_of_measures'] = export_material_unit_of_measures(db)
        print(f"✓ Exported {len(export_data['material_unit_of_measures'])} material unit of measure relationships")
        
        # 7. Recipes
        print("Exporting recipes...")
        export_data['recipes'] = export_recipes(db)
        print(f"✓ Exported {len(export_data['recipes'])} recipes")
        
        # 8. Recipe materials
        print("Exporting recipe materials...")
        export_data['recipe_materials'] = export_recipe_materials(db)
        print(f"✓ Exported {len(export_data['recipe_materials'])} recipe materials")
        
        # 9. Inventory control config
        print("Exporting inventory control config...")
        export_data['inventory_control_config'] = export_inventory_control_config(db)
        print(f"✓ Exported {len(export_data['inventory_control_config'])} inventory control config entries")
        
        # 10. Stores (master data)
        print("Exporting stores...")
        export_data['stores'] = export_stores(db)
        print(f"✓ Exported {len(export_data['stores'])} stores")
        
        # 11. Customers (master data)
        print("Exporting customers...")
        export_data['customers'] = export_customers(db)
        print(f"✓ Exported {len(export_data['customers'])} customers")
        
        # Write to JSON file
        print(f"\nWriting to file: {output_path}")
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, indent=2, ensure_ascii=False, cls=DateTimeEncoder)
        
        print("\n" + "=" * 60)
        print("✓ Database export completed successfully!")
        print(f"✓ Exported to: {output_path}")
        print("=" * 60)
        
        # Print summary
        print("\nExport Summary:")
        print(f"  - Unit of Measures: {len(export_data['unit_of_measures'])}")
        print(f"  - Product Categories: {len(export_data['product_categories'])}")
        print(f"  - Products: {len(export_data['products'])}")
        print(f"  - Materials: {len(export_data['materials'])}")
        print(f"  - Product UoM Relationships: {len(export_data['product_unit_of_measures'])}")
        print(f"  - Material UoM Relationships: {len(export_data['material_unit_of_measures'])}")
        print(f"  - Recipes: {len(export_data['recipes'])}")
        print(f"  - Recipe Materials: {len(export_data['recipe_materials'])}")
        print(f"  - Inventory Control Config: {len(export_data['inventory_control_config'])}")
        print(f"  - Stores: {len(export_data['stores'])}")
        print(f"  - Customers: {len(export_data['customers'])}")
        
    except Exception as e:
        print(f"\n✗ Error during export: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description='Export database master data to JSON file')
    parser.add_argument(
        '--output-path',
        type=str,
        default=None,
        help='Path to output JSON file (default: data/export.json relative to project root)'
    )
    
    args = parser.parse_args()
    
    # Determine output file path
    if args.output_path:
        output_path = Path(args.output_path)
    else:
        # Default to data/export.json in project root
        script_dir = Path(__file__).parent.parent.parent
        output_path = script_dir / 'data' / 'export.json'
    
    export_to_json(output_path)


if __name__ == "__main__":
    main()

