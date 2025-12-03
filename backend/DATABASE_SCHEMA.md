# Database Schema Documentation

This document describes the database schema for SofiaPOS, a Point of Sale system for restaurants and food businesses.

## Overview

The database is designed using SQLAlchemy ORM and supports both PostgreSQL and MySQL. All models are defined in Python code (no SQL scripts).

## Core Models

### Store
Represents a physical store location.

- **Fields:**
  - `id`: Primary key
  - `name`: Store name
  - `code`: Unique store code
  - `address`, `phone`, `email`: Contact information
  - `is_active`: Active status
  - `default_tables_count`: Default number of tables for the store
  - `requires_start_inventory`: Require inventory count at shift start
  - `requires_end_inventory`: Require inventory count at shift end
  - `created_at`, `updated_at`: Timestamps

- **Relationships:**
  - Has many Users, Products, Cash Registers, Shifts, Tables, Orders, Inventory Entries, Settings

### User
Represents system users (employees, managers, etc.).

- **Fields:**
  - `id`: Primary key
  - `username`: Unique username
  - `email`: Unique email
  - `hashed_password`: Password hash
  - `full_name`, `phone`: Personal information
  - `is_active`: Active status
  - `is_superuser`: Superuser flag
  - `store_id`: Associated store (nullable)
  - `created_at`, `updated_at`, `last_login`: Timestamps

- **Relationships:**
  - Belongs to Store
  - Has many Roles (many-to-many)
  - Has many Shifts, Orders, Payments

### Role & Permission
Role-based access control system.

- **Role Fields:**
  - `id`: Primary key
  - `name`: Unique role name
  - `description`: Role description
  - `is_system_role`: System role flag (cannot be deleted)

- **Permission Fields:**
  - `id`: Primary key
  - `name`: Permission name
  - `code`: Unique permission code (e.g., "products.create")
  - `resource`: Resource name (e.g., "products")
  - `action`: Action type (e.g., "create", "read", "update", "delete")

- **Relationships:**
  - Roles have many Permissions (many-to-many)
  - Users have many Roles (many-to-many)

**Default Roles:**
- Super Admin: Full system access
- Manager: Store management permissions
- Cashier: POS operations
- Cook: Kitchen operations

## Product Management

### Product
Represents sellable items.

- **Fields:**
  - `id`: Primary key
  - `store_id`: Associated store
  - `name`: Product name
  - `code`: SKU or barcode
  - `description`: Product description
  - `category_id`: Product category
  - `requires_inventory`: Whether inventory tracking is required
  - `is_active`: Active status
  - `is_top_selling`: Flag for POS quick access
  - `allow_sell_without_inventory`: Allow selling without stock
  - `selling_price`: Default selling price

- **Relationships:**
  - Belongs to Store and ProductCategory
  - Has many Tags (many-to-many)
  - Has many Images, UnitOfMeasures, Taxes, Discounts, Recipes, OrderItems

### Material
Represents ingredients and raw materials.

- **Fields:**
  - `id`: Primary key
  - `name`: Material name
  - `code`: Material code
  - `description`: Material description
  - `requires_inventory`: Whether inventory tracking is required

- **Relationships:**
  - Has many UnitOfMeasures (up to 3)
  - Used in Recipes

### Recipe
Links products to materials (ingredients).

- **Fields:**
  - `id`: Primary key
  - `product_id`: Associated product
  - `name`: Recipe name
  - `description`: Recipe description
  - `yield_quantity`: How many products this recipe makes
  - `yield_unit_of_measure_id`: Unit for yield quantity
  - `is_active`: Active status

- **Relationships:**
  - Belongs to Product
  - Has many RecipeMaterials

### RecipeMaterial
Association table for recipe ingredients.

- **Fields:**
  - `id`: Primary key
  - `recipe_id`: Associated recipe
  - `material_id`: Associated material
  - `quantity`: Required quantity
  - `unit_of_measure_id`: Unit for quantity

### ProductCategory
Product categorization with hierarchical support.

- **Fields:**
  - `id`: Primary key
  - `name`: Category name
  - `description`: Category description
  - `parent_id`: Parent category (for hierarchy)
  - `display_order`: Display order
  - `is_active`: Active status

- **Relationships:**
  - Has many Products
  - Self-referential for parent/child relationships

### ProductTag
Flexible product tagging system.

- **Fields:**
  - `id`: Primary key
  - `name`: Unique tag name
  - `color`: Hex color code for display

- **Relationships:**
  - Has many Products (many-to-many)

### ProductImage
Product images.

- **Fields:**
  - `id`: Primary key
  - `product_id`: Associated product
  - `image_url`: Image URL
  - `image_path`: Local file path
  - `is_primary`: Primary image flag
  - `display_order`: Display order

### UnitOfMeasure
Measurement units (kg, lb, piece, etc.).

- **Fields:**
  - `id`: Primary key
  - `name`: Unit name
  - `abbreviation`: Unit abbreviation
  - `type`: Unit type (weight, volume, piece, etc.)
  - `is_active`: Active status

**Default Units:**
- Weight: kg, g, lb, oz
- Volume: L, mL, gal, cup
- Piece: pcs, unit, box, pkg

### ProductUnitOfMeasure
Product unit of measure configuration (up to 3 units per product).

- **Fields:**
  - `id`: Primary key
  - `product_id`: Associated product
  - `unit_of_measure_id`: Unit of measure
  - `conversion_factor`: Conversion to base unit
  - `is_base_unit`: Base unit flag
  - `display_order`: Display order (1-3)

### MaterialUnitOfMeasure
Material unit of measure configuration (up to 3 units per material).

- **Fields:**
  - Same as ProductUnitOfMeasure but for materials

## Tax & Discount

### Tax
Tax rates.

- **Fields:**
  - `id`: Primary key
  - `name`: Tax name
  - `code`: Unique tax code
  - `rate`: Tax rate (e.g., 0.16 for 16%)
  - `description`: Tax description
  - `is_active`: Active status

- **Relationships:**
  - Has many ProductTaxes

### ProductTax
Association table for product taxes.

- **Fields:**
  - `id`: Primary key
  - `product_id`: Associated product
  - `tax_id`: Associated tax
  - `is_active`: Active status

### ProductDiscount
Product discounts.

- **Fields:**
  - `id`: Primary key
  - `product_id`: Associated product
  - `name`: Discount name
  - `description`: Discount description
  - `discount_type`: "percentage" or "fixed"
  - `discount_value`: Discount value
  - `min_quantity`: Minimum quantity to apply
  - `effective_from`, `effective_to`: Validity period
  - `is_active`: Active status

## Vendor & Customer

### Vendor
Supplier management.

- **Fields:**
  - `id`: Primary key
  - `name`: Vendor name
  - `code`: Unique vendor code
  - `contact_person`, `email`, `phone`, `address`: Contact information
  - `tax_id`: Tax identification number
  - `notes`: Additional notes
  - `is_active`: Active status

- **Relationships:**
  - Has many InventoryEntries

### Customer
Customer management.

- **Fields:**
  - `id`: Primary key
  - `name`: Customer name
  - `code`: Unique customer code
  - `email`, `phone`, `address`: Contact information
  - `tax_id`: Tax identification number
  - `credit_limit`: Credit limit
  - `notes`: Additional notes
  - `is_active`: Active status

- **Relationships:**
  - Has many Orders

## Inventory

### InventoryEntry
Inventory entries (purchases, adjustments, etc.).

- **Fields:**
  - `id`: Primary key
  - `store_id`: Associated store
  - `vendor_id`: Associated vendor (nullable)
  - `entry_number`: Entry number (PO number, etc.)
  - `entry_type`: Transaction type (purchase, sale, adjustment, transfer, waste, return)
  - `entry_date`: Entry date
  - `notes`: Additional notes
  - `created_by_user_id`: User who created the entry

- **Relationships:**
  - Belongs to Store and Vendor
  - Has many InventoryTransactions

### InventoryTransaction
Individual inventory line items.

- **Fields:**
  - `id`: Primary key
  - `entry_id`: Associated entry
  - `material_id`: Associated material (nullable)
  - `product_id`: Associated product (nullable)
  - `quantity`: Transaction quantity
  - `unit_of_measure_id`: Unit of measure
  - `unit_cost`: Cost per unit
  - `total_cost`: Total cost
  - `notes`: Additional notes

- **Relationships:**
  - Belongs to InventoryEntry, Material/Product, UnitOfMeasure

## Payment

### PaymentMethod
Payment method configuration.

- **Fields:**
  - `id`: Primary key
  - `name`: Payment method name
  - `type`: Payment type (cash, credit_card, debit_card, bank_transfer)
  - `is_active`: Active status
  - `requires_confirmation`: Requires confirmation flag

**Default Payment Methods:**
- Cash
- Credit Card
- Debit Card
- Bank Transfer

### Payment
Order payments.

- **Fields:**
  - `id`: Primary key
  - `order_id`: Associated order
  - `payment_method_id`: Payment method used
  - `amount`: Payment amount
  - `reference_number`: Transaction reference
  - `notes`: Additional notes
  - `user_id`: User who processed the payment
  - `payment_date`: Payment date

- **Relationships:**
  - Belongs to Order, PaymentMethod, User

## Cash Register

### CashRegister
Cash register management.

- **Fields:**
  - `id`: Primary key
  - `store_id`: Associated store
  - `name`: Cash register name
  - `code`: Cash register code
  - `is_active`: Active status

- **Relationships:**
  - Belongs to Store
  - Has many CashRegisterHistories and Orders

### CashRegisterHistory
Cash register open/close history.

- **Fields:**
  - `id`: Primary key
  - `cash_register_id`: Associated cash register
  - `shift_id`: Associated shift (nullable)
  - `status`: Status (open, closed)
  - `opening_balance`: Opening balance
  - `closing_balance`: Closing balance
  - `expected_balance`: Expected balance
  - `difference`: Difference between expected and actual
  - `opened_by_user_id`: User who opened
  - `closed_by_user_id`: User who closed
  - `opened_at`: Opening timestamp
  - `closed_at`: Closing timestamp
  - `notes`: Additional notes

- **Relationships:**
  - Belongs to CashRegister, Shift, Users (opened_by, closed_by)

## Shift

### Shift
Work shift management.

- **Fields:**
  - `id`: Primary key
  - `store_id`: Associated store
  - `shift_number`: Shift number
  - `status`: Status (open, closed)
  - `opened_by_user_id`: User who opened
  - `closed_by_user_id`: User who closed
  - `opened_at`: Opening timestamp
  - `closed_at`: Closing timestamp
  - `notes`: Additional notes

**Note**: Inventory requirements (`requires_start_inventory` and `requires_end_inventory`) are configured at the Store level, not per shift.

- **Relationships:**
  - Belongs to Store
  - Has many ShiftUsers and Orders

### ShiftUser
Association table for shift users.

- **Fields:**
  - `id`: Primary key
  - `shift_id`: Associated shift
  - `user_id`: Associated user
  - `joined_at`: Join timestamp
  - `left_at`: Leave timestamp
  - `removed_by_user_id`: User who removed (if removed)
  - `removal_reason`: Reason for removal

- **Relationships:**
  - Belongs to Shift and User

## Table

### Table
Restaurant table management.

- **Fields:**
  - `id`: Primary key
  - `store_id`: Associated store
  - `table_number`: Table number
  - `name`: Table name
  - `capacity`: Table capacity
  - `location`: Table location (e.g., "Indoor", "Outdoor")
  - `is_active`: Active status

- **Relationships:**
  - Belongs to Store
  - Has many Orders

## Order

### Order
Sales orders.

- **Fields:**
  - `id`: Primary key
  - `store_id`: Associated store
  - `shift_id`: Associated shift
  - `cash_register_id`: Associated cash register
  - `table_id`: Associated table (nullable)
  - `customer_id`: Associated customer (nullable)
  - `user_id`: User who created the order
  - `order_number`: Unique order number
  - `status`: Status (draft, open, paid, cancelled)
  - `subtotal`: Subtotal amount
  - `tax_amount`: Tax amount
  - `discount_amount`: Discount amount
  - `total`: Total amount
  - `notes`: Additional notes
  - `created_at`: Creation timestamp
  - `updated_at`: Update timestamp
  - `paid_at`: Payment timestamp

- **Relationships:**
  - Belongs to Store, Shift, CashRegister, Table, Customer, User
  - Has many OrderItems and Payments

### OrderItem
Order line items.

- **Fields:**
  - `id`: Primary key
  - `order_id`: Associated order
  - `product_id`: Associated product
  - `quantity`: Item quantity
  - `unit_of_measure_id`: Unit of measure
  - `unit_price`: Unit price
  - `discount_amount`: Discount amount
  - `tax_amount`: Tax amount
  - `total`: Line total
  - `notes`: Additional notes
  - `display_order`: Display order

- **Relationships:**
  - Belongs to Order, Product, UnitOfMeasure

## Settings

### Setting
Application and store-specific settings.

- **Fields:**
  - `id`: Primary key
  - `store_id`: Associated store (NULL for global settings)
  - `key`: Setting key
  - `value`: Setting value
  - `value_type`: Value type (string, integer, float, boolean, json)
  - `description`: Setting description
  - `is_system_setting`: System setting flag (cannot be deleted)

- **Relationships:**
  - Belongs to Store (nullable)

## Database Initialization

Run the initialization script to create tables and default data:

```bash
python -m app.scripts.init_db
```

This will create:
- All database tables
- Default permissions
- Default roles (Super Admin, Manager, Cashier, Cook)
- Default payment methods
- Default unit of measures

## Database Migrations

Use Alembic for database migrations:

```bash
# Create a new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

