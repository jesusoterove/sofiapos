"""
Database initialization script.
Creates default roles, permissions, payment methods, and unit of measures.
"""
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models import (
    Role, Permission, PaymentMethod, PaymentMethodType,
    UnitOfMeasure, Setting, Store, StoreProductGroup
)


def create_default_permissions(db: Session):
    """Create default permissions for the system."""
    permissions = [
        # Store permissions
        {"name": "View Stores", "code": "stores.view", "resource": "stores", "action": "view"},
        {"name": "Create Stores", "code": "stores.create", "resource": "stores", "action": "create"},
        {"name": "Update Stores", "code": "stores.update", "resource": "stores", "action": "update"},
        {"name": "Delete Stores", "code": "stores.delete", "resource": "stores", "action": "delete"},
        
        # User permissions
        {"name": "View Users", "code": "users.view", "resource": "users", "action": "view"},
        {"name": "Create Users", "code": "users.create", "resource": "users", "action": "create"},
        {"name": "Update Users", "code": "users.update", "resource": "users", "action": "update"},
        {"name": "Delete Users", "code": "users.delete", "resource": "users", "action": "delete"},
        
        # Role permissions
        {"name": "View Roles", "code": "roles.view", "resource": "roles", "action": "view"},
        {"name": "Create Roles", "code": "roles.create", "resource": "roles", "action": "create"},
        {"name": "Update Roles", "code": "roles.update", "resource": "roles", "action": "update"},
        {"name": "Delete Roles", "code": "roles.delete", "resource": "roles", "action": "delete"},
        
        # Product permissions
        {"name": "View Products", "code": "products.view", "resource": "products", "action": "view"},
        {"name": "Create Products", "code": "products.create", "resource": "products", "action": "create"},
        {"name": "Update Products", "code": "products.update", "resource": "products", "action": "update"},
        {"name": "Delete Products", "code": "products.delete", "resource": "products", "action": "delete"},
        
        # Material permissions
        {"name": "View Materials", "code": "materials.view", "resource": "materials", "action": "view"},
        {"name": "Create Materials", "code": "materials.create", "resource": "materials", "action": "create"},
        {"name": "Update Materials", "code": "materials.update", "resource": "materials", "action": "update"},
        {"name": "Delete Materials", "code": "materials.delete", "resource": "materials", "action": "delete"},
        
        # Inventory permissions
        {"name": "View Inventory", "code": "inventory.view", "resource": "inventory", "action": "view"},
        {"name": "Create Inventory Entries", "code": "inventory.create", "resource": "inventory", "action": "create"},
        {"name": "Update Inventory Entries", "code": "inventory.update", "resource": "inventory", "action": "update"},
        {"name": "Delete Inventory Entries", "code": "inventory.delete", "resource": "inventory", "action": "delete"},
        
        # Order permissions
        {"name": "View Orders", "code": "orders.view", "resource": "orders", "action": "view"},
        {"name": "Create Orders", "code": "orders.create", "resource": "orders", "action": "create"},
        {"name": "Update Orders", "code": "orders.update", "resource": "orders", "action": "update"},
        {"name": "Delete Orders", "code": "orders.delete", "resource": "orders", "action": "delete"},
        {"name": "Process Payments", "code": "orders.pay", "resource": "orders", "action": "pay"},
        
        # Shift permissions
        {"name": "View Shifts", "code": "shifts.view", "resource": "shifts", "action": "view"},
        {"name": "Open Shifts", "code": "shifts.open", "resource": "shifts", "action": "open"},
        {"name": "Close Shifts", "code": "shifts.close", "resource": "shifts", "action": "close"},
        {"name": "Manage Shift Users", "code": "shifts.manage_users", "resource": "shifts", "action": "manage_users"},
        
        # Cash Register permissions
        {"name": "View Cash Registers", "code": "cash_registers.view", "resource": "cash_registers", "action": "view"},
        {"name": "Open Cash Registers", "code": "cash_registers.open", "resource": "cash_registers", "action": "open"},
        {"name": "Close Cash Registers", "code": "cash_registers.close", "resource": "cash_registers", "action": "close"},
        
        # Report permissions
        {"name": "View Reports", "code": "reports.view", "resource": "reports", "action": "view"},
        {"name": "Export Reports", "code": "reports.export", "resource": "reports", "action": "export"},
        
        # Settings permissions
        {"name": "View Settings", "code": "settings.view", "resource": "settings", "action": "view"},
        {"name": "Update Settings", "code": "settings.update", "resource": "settings", "action": "update"},
    ]
    
    for perm_data in permissions:
        existing = db.query(Permission).filter(Permission.code == perm_data["code"]).first()
        if not existing:
            permission = Permission(**perm_data)
            db.add(permission)
    
    db.commit()
    print("✓ Default permissions created")


def create_default_roles(db: Session):
    """Create default roles and assign permissions."""
    # Super Admin role - all permissions
    admin_role = db.query(Role).filter(Role.name == "Super Admin").first()
    if not admin_role:
        admin_role = Role(
            name="Super Admin",
            description="Full system access with all permissions",
            is_system_role=True
        )
        db.add(admin_role)
        db.flush()
        
        # Assign all permissions to admin
        all_permissions = db.query(Permission).all()
        admin_role.permissions = all_permissions
    
    # Manager role - most permissions except user/role management
    manager_role = db.query(Role).filter(Role.name == "Manager").first()
    if not manager_role:
        manager_role = Role(
            name="Manager",
            description="Store management with product, inventory, and order permissions",
            is_system_role=True
        )
        db.add(manager_role)
        db.flush()
        
        # Assign manager permissions
        manager_permissions = db.query(Permission).filter(
            Permission.code.in_([
                "stores.view", "stores.update",
                "products.view", "products.create", "products.update", "products.delete",
                "materials.view", "materials.create", "materials.update", "materials.delete",
                "inventory.view", "inventory.create", "inventory.update", "inventory.delete",
                "orders.view", "orders.create", "orders.update", "orders.delete", "orders.pay",
                "shifts.view", "shifts.open", "shifts.close", "shifts.manage_users",
                "cash_registers.view", "cash_registers.open", "cash_registers.close",
                "reports.view", "reports.export",
                "settings.view", "settings.update",
            ])
        ).all()
        manager_role.permissions = manager_permissions
    
    # Cashier role - order and payment permissions
    cashier_role = db.query(Role).filter(Role.name == "Cashier").first()
    if not cashier_role:
        cashier_role = Role(
            name="Cashier",
            description="Point of sale operations - orders and payments",
            is_system_role=True
        )
        db.add(cashier_role)
        db.flush()
        
        # Assign cashier permissions
        cashier_permissions = db.query(Permission).filter(
            Permission.code.in_([
                "products.view",
                "orders.view", "orders.create", "orders.update", "orders.pay",
                "shifts.view",
                "cash_registers.view", "cash_registers.open", "cash_registers.close",
            ])
        ).all()
        cashier_role.permissions = cashier_permissions
    
    # Cook/Kitchen role - view orders and inventory
    cook_role = db.query(Role).filter(Role.name == "Cook").first()
    if not cook_role:
        cook_role = Role(
            name="Cook",
            description="Kitchen operations - view orders and manage inventory",
            is_system_role=True
        )
        db.add(cook_role)
        db.flush()
        
        # Assign cook permissions
        cook_permissions = db.query(Permission).filter(
            Permission.code.in_([
                "products.view",
                "orders.view", "orders.update",
                "inventory.view", "inventory.create", "inventory.update",
                "materials.view",
            ])
        ).all()
        cook_role.permissions = cook_permissions
    
    db.commit()
    print("✓ Default roles created")


def create_default_payment_methods(db: Session):
    """Create default payment methods."""
    payment_methods = [
        {"name": "Cash", "type": PaymentMethodType.CASH, "is_active": True, "requires_confirmation": False},
        {"name": "Credit Card", "type": PaymentMethodType.CREDIT_CARD, "is_active": True, "requires_confirmation": True},
        {"name": "Debit Card", "type": PaymentMethodType.DEBIT_CARD, "is_active": True, "requires_confirmation": True},
        {"name": "Bank Transfer", "type": PaymentMethodType.BANK_TRANSFER, "is_active": True, "requires_confirmation": True},
    ]
    
    for pm_data in payment_methods:
        existing = db.query(PaymentMethod).filter(PaymentMethod.name == pm_data["name"]).first()
        if not existing:
            payment_method = PaymentMethod(**pm_data)
            db.add(payment_method)
    
    db.commit()
    print("✓ Default payment methods created")


def create_default_unit_of_measures(db: Session):
    """Create default unit of measures."""
    units = [
        # Weight units
        {"name": "KILOS", "abbreviation": "KG", "type": "weight", "is_active": True},
        {"name": "GRAMOS", "abbreviation": "GR", "type": "weight", "is_active": True},
        {"name": "LIBRAS", "abbreviation": "LB", "type": "weight", "is_active": True},
        
        # Volume units
        {"name": "LITROS", "abbreviation": "LT", "type": "volume", "is_active": True},
        {"name": "MILILITROS", "abbreviation": "ML", "type": "volume", "is_active": True},
        {"name": "GALONES", "abbreviation": "GAL", "type": "volume", "is_active": True},
        {"name": "TAZAS", "abbreviation": "TAZ", "type": "volume", "is_active": True},
        
        # Piece units
        {"name": "PIEZAS", "abbreviation": "PZA", "type": "piece", "is_active": True},
        {"name": "UNIDADES", "abbreviation": "UND", "type": "piece", "is_active": True},
        {"name": "CAJAS", "abbreviation": "CAJ", "type": "piece", "is_active": True},
        {"name": "PAQUETES", "abbreviation": "PAQ", "type": "piece", "is_active": True},
        {"name": "BOLSAS", "abbreviation": "BOL", "type": "piece", "is_active": True},
        {"name": "BLOQUES", "abbreviation": "BLO", "type": "piece", "is_active": True},
    ]
    
    for unit_data in units:
        existing = db.query(UnitOfMeasure).filter(UnitOfMeasure.abbreviation == unit_data["abbreviation"]).first()
        if not existing:
            unit = UnitOfMeasure(**unit_data)
            db.add(unit)
    
    db.commit()
    print("✓ Default unit of measures created")


def create_default_settings(db: Session):
    """Create default application-wide settings."""
    settings = [
        {
            "key": "customer_tax_id_types",
            "value": "NIT|NIT;CC|Cédula;CE|Cédula Extranjería",
            "value_type": "string",
            "description": "Available tax ID types for customers. Format: value|label;value|label",
            "is_system_setting": True,
            "store_id": None,  # Global setting
        },
        {
            "key": "money_decimal_places",
            "value": "2",
            "value_type": "integer",
            "description": "Number of decimal places for money values",
            "is_system_setting": True,
            "store_id": None,  # Global setting
        },
        {
            "key": "default_language",
            "value": "es",
            "value_type": "string",
            "description": "Default language for the application (e.g., 'en' for English, 'es' for Spanish)",
            "is_system_setting": True,
            "store_id": None,  # Global setting
        },
    ]
    
    for setting_data in settings:
        existing = db.query(Setting).filter(
            Setting.key == setting_data["key"],
            Setting.store_id == setting_data["store_id"]
        ).first()
        if not existing:
            setting = Setting(**setting_data)
            db.add(setting)
    
    db.commit()
    print("✓ Default settings created")


def create_bookmark_groups_for_stores(db: Session):
    """Create bookmark groups for all existing stores."""
    stores = db.query(Store).all()
    group_name = "Favoritos"
    for store in stores:
        # Check if bookmark group already exists
        existing = db.query(StoreProductGroup).filter(
            StoreProductGroup.store_id == store.id,
            StoreProductGroup.group_name == group_name
        ).first()
        
        if not existing:
            bookmark_group = StoreProductGroup(
                store_id=store.id,
                group_name=group_name
            )
            db.add(bookmark_group)
    
    db.commit()
    print(f"✓ Bookmark groups created for {len(stores)} stores")


def init_db():
    """Initialize the database with default data."""
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created")
    
    db = SessionLocal()
    try:
        create_default_permissions(db)
        create_default_roles(db)
        create_default_payment_methods(db)
        create_default_unit_of_measures(db)
        create_default_settings(db)
        create_bookmark_groups_for_stores(db)
        print("\n✓ Database initialization completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"\n✗ Error during initialization: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_db()

