# User Stories - SofiaPOS

This document contains user stories for both the Console (Administration) and POS applications.

## User Story Format

Each user story follows the format:
- **As a** [role/user type]
- **I want** [goal/functionality]
- **So that** [benefit/value]

With acceptance criteria and notes where applicable.

---

# Console (Administration App) User Stories

## Authentication & Authorization

### US-CON-001: User Login
**As a** system user  
**I want** to log in with my username and password  
**So that** I can access the administration system

**Acceptance Criteria:**
- User can enter username and password
- System validates credentials
- On success, user is redirected to dashboard
- On failure, error message is displayed
- Session is maintained across browser sessions
- User can log out

### US-CON-002: Role-Based Access Control
**As a** system administrator  
**I want** to assign roles and permissions to users  
**So that** users only have access to features they need

**Acceptance Criteria:**
- Admin can view all roles and permissions
- Admin can create new roles
- Admin can assign permissions to roles
- Admin can assign roles to users
- Users see only features they have permission for
- System prevents unauthorized actions

### US-CON-003: Multi-Store Access
**As a** user with access to multiple stores  
**I want** to switch between stores  
**So that** I can manage different store locations

**Acceptance Criteria:**
- User can see all stores they have access to
- User can switch stores from header dropdown
- Current store context is maintained
- Data displayed is filtered by selected store

## Store Management

### US-CON-004: Create Store
**As a** system administrator  
**I want** to create a new store  
**So that** I can manage multiple store locations

**Acceptance Criteria:**
- Admin can access store creation form
- Form includes: name, code, address, phone, email
- Store code must be unique
- Admin can set default number of tables
- Admin can configure inventory requirements (start/end of shift)
- New store is created and appears in store list

### US-CON-005: Manage Store Settings
**As a** store manager  
**I want** to update store information and settings  
**So that** store details are accurate and up-to-date

**Acceptance Criteria:**
- Manager can edit store details
- Manager can configure default tables count
- Manager can configure inventory requirements
- Changes are saved and reflected immediately
- Validation prevents invalid data

## User Management

### US-CON-006: Create User
**As a** system administrator or manager  
**I want** to create new user accounts  
**So that** employees can access the system

**Acceptance Criteria:**
- Admin/Manager can access user creation form
- Form includes: username, email, password, full name, phone
- Username and email must be unique
- Admin can assign user to a store
- Admin can assign roles to user
- User receives notification (if email configured)

### US-CON-007: Manage User Roles
**As a** system administrator  
**I want** to assign or change user roles  
**So that** users have appropriate permissions

**Acceptance Criteria:**
- Admin can view user's current roles
- Admin can add roles to user
- Admin can remove roles from user
- Changes take effect immediately
- System prevents removing last role from user

### US-CON-008: Deactivate User
**As a** system administrator  
**I want** to deactivate user accounts  
**So that** former employees cannot access the system

**Acceptance Criteria:**
- Admin can deactivate user account
- Deactivated users cannot log in
- Deactivated users are marked in user list
- Admin can reactivate users
- Historical data remains associated with user

## Product Management

### US-CON-009: Create Product
**As a** store manager  
**I want** to create new products  
**So that** they can be sold in the POS system

**Acceptance Criteria:**
- Manager can access product creation form
- Form includes: name, code (SKU), description, category, selling price
- Manager can set if product requires inventory
- Manager can set if product can be sold without inventory
- Manager can mark product as top-selling
- Product is saved and available in POS

### US-CON-010: Manage Product Categories
**As a** store manager  
**I want** to organize products into categories  
**So that** products are easier to find and manage

**Acceptance Criteria:**
- Manager can create product categories
- Manager can create hierarchical categories (parent/child)
- Manager can assign products to categories
- Manager can reorder categories
- Categories appear in POS for product selection

### US-CON-011: Upload Product Images
**As a** store manager  
**I want** to upload images for products  
**So that** products are visually identifiable in the POS

**Acceptance Criteria:**
- Manager can upload product images
- Manager can set primary image
- Manager can upload multiple images
- Images are displayed in product list and POS
- Generic placeholder shown if no image

### US-CON-012: Configure Product Unit of Measures
**As a** store manager  
**I want** to configure up to 3 units of measure for products  
**So that** products can be sold in different units (e.g., piece, box, kg)

**Acceptance Criteria:**
- Manager can add unit of measures to product
- Maximum 3 units per product
- Manager can set conversion factors
- Manager can set base unit
- Manager can set display order

### US-CON-013: Mark Top-Selling Products
**As a** store manager  
**I want** to mark products as top-selling  
**So that** they appear as a quick-access category in POS

**Acceptance Criteria:**
- Manager can mark/unmark products as top-selling
- Top-selling products appear in special category in POS
- Multiple products can be top-selling
- Changes sync to POS immediately

## Material & Recipe Management

### US-CON-014: Create Material
**As a** store manager  
**I want** to create materials (ingredients)  
**So that** I can track inventory and create recipes

**Acceptance Criteria:**
- Manager can create materials with name, code, description
- Manager can set if material requires inventory
- Manager can configure up to 3 units of measure
- Materials can be used in recipes

### US-CON-015: Create Recipe
**As a** store manager  
**I want** to create recipes linking products to materials  
**So that** I can track material usage when products are sold

**Acceptance Criteria:**
- Manager can create recipe for a product
- Manager can add materials to recipe with quantities
- Manager can set recipe yield (how many products recipe makes)
- System can calculate material requirements for orders

### US-CON-016: Configure Material Unit of Measures
**As a** store manager  
**I want** to configure up to 3 units of measure for materials  
**So that** materials can be tracked in different units

**Acceptance Criteria:**
- Manager can add unit of measures to material
- Maximum 3 units per material
- Manager can set conversion factors
- Manager can set base unit for inventory

## Inventory Management

### US-CON-017: Create Inventory Entry
**As a** store manager  
**I want** to record inventory entries (purchases, adjustments)  
**So that** inventory levels are accurate

**Acceptance Criteria:**
- Manager can create inventory entry
- Manager can select entry type (purchase, adjustment, transfer, waste, return)
- Manager can add multiple materials/products to entry
- Manager can record quantities and costs
- Manager can associate vendor with purchase entries
- Inventory levels update automatically

### US-CON-018: View Inventory Stock Levels
**As a** store manager  
**I want** to view current inventory stock levels  
**So that** I know what materials/products are available

**Acceptance Criteria:**
- Manager can view stock levels for all materials/products
- Stock levels show by unit of measure
- Manager can filter by material/product
- Manager can see stock history
- Low stock warnings are displayed

## Tax & Discount Management

### US-CON-019: Create Tax
**As a** store manager  
**I want** to create tax rates  
**So that** taxes are automatically calculated on sales

**Acceptance Criteria:**
- Manager can create tax with name, code, rate
- Tax rate is percentage (e.g., 16%)
- Manager can assign taxes to products
- Multiple taxes can apply to one product

### US-CON-020: Create Product Discount
**As a** store manager  
**I want** to create discounts for products  
**So that** I can offer promotions

**Acceptance Criteria:**
- Manager can create discount (percentage or fixed amount)
- Manager can set minimum quantity for discount
- Manager can set effective dates
- Discounts apply automatically in POS

## Vendor & Customer Management

### US-CON-021: Create Vendor
**As a** store manager  
**I want** to create vendor records  
**So that** I can track purchases from suppliers

**Acceptance Criteria:**
- Manager can create vendor with contact information
- Manager can record vendor tax ID
- Vendors can be associated with inventory entries
- Vendor list is searchable

### US-CON-022: Create Customer
**As a** store manager  
**I want** to create customer records  
**So that** I can track customer information and sales history

**Acceptance Criteria:**
- Manager can create customer with name, contact info
- Manager can set credit limit
- Customer can be selected in POS
- Customer order history is tracked

## Payment Method Configuration

### US-CON-023: Configure Payment Methods
**As a** system administrator  
**I want** to configure available payment methods  
**So that** POS can accept different payment types

**Acceptance Criteria:**
- Admin can enable/disable payment methods
- Available methods: Cash, Credit Card, Debit Card, Bank Transfer
- Admin can set if confirmation is required
- Changes sync to POS

## Order Management

### US-CON-024: View Orders
**As a** store manager  
**I want** to view all orders  
**So that** I can track sales and order history

**Acceptance Criteria:**
- Manager can view list of all orders
- Orders show: number, date, customer, total, status
- Manager can filter by date, status, customer
- Manager can view order details with items
- Manager can see payment history

### US-CON-025: View Order Details
**As a** store manager  
**I want** to view detailed order information  
**So that** I can see what was sold and how it was paid

**Acceptance Criteria:**
- Manager can view complete order details
- Order shows all items with quantities and prices
- Order shows customer information
- Order shows payment method and amount
- Manager can print receipt

## Cash Register Management

### US-CON-026: View Cash Registers
**As a** store manager  
**I want** to view cash register status and history  
**So that** I can monitor cash operations

**Acceptance Criteria:**
- Manager can see all cash registers
- Manager can see which registers are open/closed
- Manager can view cash register history
- History shows opening/closing balances
- Manager can see differences (expected vs actual)

## Shift Management

### US-CON-027: View Shifts
**As a** store manager  
**I want** to view shift history  
**So that** I can track work schedules and operations

**Acceptance Criteria:**
- Manager can view all shifts
- Shifts show: number, date, status, users, orders
- Manager can filter by date, status
- Manager can view shift details

## Reports

### US-CON-028: View Sales Reports
**As a** store manager  
**I want** to view sales reports  
**So that** I can analyze business performance

**Acceptance Criteria:**
- Manager can generate sales reports by date range
- Reports show: total sales, number of orders, average order value
- Reports can be filtered by product, category, payment method
- Reports can be exported

### US-CON-029: View Inventory Reports
**As a** store manager  
**I want** to view inventory reports  
**So that** I can track inventory movements and costs

**Acceptance Criteria:**
- Manager can generate inventory reports
- Reports show: stock levels, movements, costs
- Reports can be filtered by material/product, date range
- Reports can be exported

## Settings

### US-CON-030: Manage System Settings
**As a** system administrator  
**I want** to configure system-wide settings  
**So that** the system behaves according to business needs

**Acceptance Criteria:**
- Admin can view and edit system settings
- Settings include: language, currency, date format
- Changes apply system-wide
- Settings are validated

---

# POS (Point of Sale) User Stories

## Installation & Setup

### US-POS-001: Install POS Application
**As a** store owner  
**I want** to install the POS application on a computer or mobile device  
**So that** I can use it for sales operations

**Acceptance Criteria:**
- Application can be installed as PWA or desktop app
- Installation process is simple and guided
- Application works offline after installation
- Application can sync with administration system

### US-POS-002: Setup Store During Installation
**As a** store owner  
**I want** to configure my store during installation  
**So that** the POS is ready to use

**Acceptance Criteria:**
- User can enter store code/credentials
- Application downloads store configuration
- Store products and settings are synced
- Application is ready to use after setup

## Authentication

### US-POS-003: Login to POS
**As a** cashier  
**I want** to log in to the POS system  
**So that** I can process sales

**Acceptance Criteria:**
- Cashier can enter username and password
- System validates credentials
- On success, cashier sees POS screen
- Session is maintained during shift
- Cashier can log out

## Shift Management

### US-POS-004: Open Shift
**As a** cashier or manager  
**I want** to open a new shift  
**So that** I can start processing sales

**Acceptance Criteria:**
- User can open shift from POS
- System checks if inventory count is required (based on store settings)
- If required, user must complete inventory count before opening
- Shift number is generated automatically
- User is added to shift automatically
- Shift status is displayed in bottom bar

### US-POS-005: Add User to Shift
**As a** shift supervisor  
**I want** to add users to the current shift  
**So that** multiple people can work on the same shift

**Acceptance Criteria:**
- Supervisor can add users to shift
- User list shows available users
- Added users appear in shift
- Users can process orders once added

### US-POS-006: Remove User from Shift
**As a** shift supervisor  
**I want** to remove users from shift  
**So that** only authorized people work on the shift

**Acceptance Criteria:**
- Supervisor can remove users from shift
- Permission and password confirmation required
- Removed user cannot process new orders
- Removal reason can be recorded
- Removal is logged

### US-POS-007: Close Shift
**As a** shift supervisor  
**I want** to close the current shift  
**So that** shift operations are finalized

**Acceptance Criteria:**
- Supervisor can close shift
- System checks if inventory count is required (based on store settings)
- If required, user must complete inventory count before closing
- All orders must be finalized
- Shift summary is displayed
- Shift is marked as closed

## Cash Register Management

### US-POS-008: Open Cash Register
**As a** cashier  
**I want** to open a cash register  
**So that** I can process cash payments

**Acceptance Criteria:**
- Cashier can open cash register
- Cashier enters opening balance
- Cash register status is displayed
- Cash register is available for payments

### US-POS-009: Close Cash Register
**As a** cashier or supervisor  
**I want** to close a cash register  
**So that** cash is counted and reconciled

**Acceptance Criteria:**
- User can close cash register
- User enters closing balance
- System calculates expected balance
- System shows difference (expected vs actual)
- Cash register history is recorded
- Cash register is marked as closed

## Product Selection

### US-POS-010: Browse Products by Category
**As a** cashier  
**I want** to browse products by category  
**So that** I can quickly find products to sell

**Acceptance Criteria:**
- Cashier can see category tabs
- Cashier can select category
- Products in category are displayed
- Products show: name, price, image (if available)
- Cashier can scroll through products

### US-POS-011: Search Products
**As a** cashier  
**I want** to search for products  
**So that** I can quickly find specific products

**Acceptance Criteria:**
- Cashier can enter search query
- Search filters products by name or code
- Results update as cashier types
- Search is fast and responsive
- Search works offline

### US-POS-012: Scan Product Barcode
**As a** cashier  
**I want** to scan product barcodes  
**So that** I can quickly add products to order

**Acceptance Criteria:**
- Cashier can activate barcode scanner
- Scanner reads product code
- Product is automatically added to order
- If product not found, error is shown
- Scanner works with camera or manual input

### US-POS-013: View Top-Selling Products
**As a** cashier  
**I want** to see top-selling products  
**So that** I can quickly access frequently sold items

**Acceptance Criteria:**
- Top-selling products appear as special category
- Products are marked by manager in console
- Category is easily accessible
- Products show same information as regular products

## Order Management

### US-POS-014: Create New Order
**As a** cashier  
**I want** to create a new order  
**So that** I can process a sale

**Acceptance Criteria:**
- Cashier can start new order
- Order starts empty
- Order number is generated
- Order status is "draft"
- Cashier can add products to order

### US-POS-015: Add Product to Order
**As a** cashier  
**I want** to add products to the current order  
**So that** I can build the customer's order

**Acceptance Criteria:**
- Cashier can click product to add to order
- Product is added with quantity 1
- If product already in order, quantity increases
- Order total updates automatically
- Product appears in order details panel

### US-POS-016: Adjust Product Quantity
**As a** cashier  
**I want** to adjust product quantities in order  
**So that** I can correct quantities or add more items

**Acceptance Criteria:**
- Cashier can increase quantity with + button
- Cashier can decrease quantity with - button
- Cashier can click quantity to edit directly
- Quantity cannot go below 1 (use remove instead)
- Order total updates automatically

### US-POS-017: Remove Product from Order
**As a** cashier  
**I want** to remove products from order  
**So that** I can correct mistakes

**Acceptance Criteria:**
- Cashier can remove product with X button
- Confirmation may be required for large quantities
- Product is removed from order
- Order total updates automatically

### US-POS-018: Select Customer for Order
**As a** cashier  
**I want** to select or create a customer for order  
**So that** customer information is associated with sale

**Acceptance Criteria:**
- Cashier can select default customer
- Cashier can search for customer
- Cashier can create new customer
- Customer name is displayed in order
- Customer information is saved with order

### US-POS-019: Save Order as Draft
**As a** cashier  
**I want** to save order as draft  
**So that** I can complete it later

**Acceptance Criteria:**
- Cashier can save order as draft
- Draft orders are saved locally
- Draft orders sync to server when online
- Cashier can retrieve draft orders
- Draft orders can be completed later

### US-POS-020: Cancel Order
**As a** cashier  
**I want** to cancel the current order  
**So that** I can start fresh

**Acceptance Criteria:**
- Cashier can cancel order
- Confirmation is required if order has items
- Order is cleared
- New order can be started

## Table Management

### US-POS-021: View Tables Grid
**As a** cashier  
**I want** to see a grid of all tables  
**So that** I can manage table orders

**Acceptance Criteria:**
- Cashier can view tables grid
- Each table shows: number, name, status, capacity, location
- Tables show order status (open/closed)
- Tables are color-coded by status
- Cashier can click table to view details

### US-POS-022: Open Table Order
**As a** cashier  
**I want** to open an order for a table  
**So that** customers can order before paying

**Acceptance Criteria:**
- Cashier can select table
- Cashier can open order for table
- Order is associated with table
- Table status shows order is open
- Cashier can add items to table order

### US-POS-023: View Table Order
**As a** cashier  
**I want** to view order for a table  
**So that** I can see what has been ordered

**Acceptance Criteria:**
- Cashier can click table to view order
- Order details are displayed
- Cashier can add/modify items
- Order total is shown
- Cashier can process payment

### US-POS-024: Add Table
**As a** store manager  
**I want** to add tables to the store  
**So that** I can manage more seating

**Acceptance Criteria:**
- Manager can add new table
- Manager can set: number, name, capacity, location
- Table appears in tables grid
- Table is available for orders

## Payment Processing

### US-POS-025: Process Payment
**As a** cashier  
**I want** to process payment for an order  
**So that** the sale is completed

**Acceptance Criteria:**
- Cashier can click Pay button
- Payment screen opens
- Cashier selects payment method (Cash or Bank Transfer only)
- Cashier enters amount paid
- System calculates change
- Payment is processed
- Order status changes to "paid"
- Receipt can be printed

### US-POS-026: Process Cash Payment
**As a** cashier  
**I want** to process cash payment  
**So that** cash transactions are recorded

**Acceptance Criteria:**
- Cashier selects Cash payment method
- Cashier enters amount received
- System calculates change
- Change is displayed prominently
- Payment is recorded
- Cash register balance updates

### US-POS-027: Process Bank Transfer Payment
**As a** cashier  
**I want** to process bank transfer payment  
**So that** non-cash payments are recorded

**Acceptance Criteria:**
- Cashier selects Bank Transfer payment method
- Cashier can enter reference number (optional)
- Payment amount equals order total (no change)
- Payment is recorded
- Reference number is saved

### US-POS-028: Print Receipt
**As a** cashier  
**I want** to print receipt after payment  
**So that** customer has proof of purchase

**Acceptance Criteria:**
- Receipt can be printed after payment
- Receipt shows: order number, date, items, totals, payment method
- Receipt can be reprinted
- Receipt format is clear and readable

## Inventory Management

### US-POS-029: Record Inventory Entry
**As a** cashier or manager  
**I want** to record inventory entries during shift  
**So that** inventory is tracked accurately

**Acceptance Criteria:**
- User can access inventory entry screen
- User can create inventory entry
- User can select entry type (purchase, adjustment, etc.)
- User can add materials/products with quantities
- Entry is saved locally and synced
- Entry appears in inventory history

### US-POS-030: Complete Inventory Count (Start of Shift)
**As a** cashier  
**I want** to complete inventory count at shift start  
**So that** starting inventory levels are recorded

**Acceptance Criteria:**
- System prompts for inventory count if required by store settings
- Cashier can count materials/products
- Cashier can enter quantities
- Count is saved
- Shift can be opened after count

### US-POS-031: Complete Inventory Count (End of Shift)
**As a** cashier  
**I want** to complete inventory count at shift end  
**So that** ending inventory levels are recorded

**Acceptance Criteria:**
- System prompts for inventory count if required by store settings
- Cashier can count materials/products
- Cashier can enter quantities
- Count is saved
- Shift can be closed after count

## Offline Functionality

### US-POS-032: Work Offline
**As a** cashier  
**I want** to use POS when internet is unavailable  
**So that** sales operations continue uninterrupted

**Acceptance Criteria:**
- POS works without internet connection
- Products are available offline
- Orders can be created offline
- Payments can be processed offline
- Data is stored locally
- Sync indicator shows offline status

### US-POS-033: Sync Data When Online
**As a** system administrator  
**I want** POS data to sync when connection is restored  
**So that** all sales are recorded in the system

**Acceptance Criteria:**
- System detects when connection is restored
- Pending orders are synced automatically
- Sync status is displayed
- User can manually trigger sync
- Sync conflicts are resolved
- Sync history is maintained

## Settings & Configuration

### US-POS-034: View Sync Status
**As a** cashier  
**I want** to see sync status  
**So that** I know if data is syncing properly

**Acceptance Criteria:**
- Sync status is shown in bottom bar
- Status shows: online/offline, pending sync count
- User can click to see sync details
- Sync progress is shown during sync

### US-POS-035: Change Language
**As a** cashier  
**I want** to change the application language  
**So that** I can use the POS in my preferred language

**Acceptance Criteria:**
- User can select language from settings
- Available languages: English (base), Spanish (default)
- Interface updates immediately
- Language preference is saved
- New languages can be added easily

---

## User Story Priorities

### High Priority (MVP)
- Authentication (US-CON-001, US-POS-003)
- Product Management (US-CON-009, US-POS-010, US-POS-011)
- Order Management (US-POS-014, US-POS-015, US-POS-016)
- Payment Processing (US-POS-025, US-POS-026)
- Shift Management (US-POS-004, US-POS-007)
- Cash Register (US-POS-008, US-POS-009)
- Offline Functionality (US-POS-032, US-POS-033)

### Medium Priority
- User Management (US-CON-006, US-CON-007)
- Inventory Management (US-CON-017, US-POS-029)
- Reports (US-CON-028)
- Table Management (US-POS-021, US-POS-022)

### Low Priority (Future Enhancements)
- Advanced Reports
- Recipe Management
- Advanced Discounts
- Customer Loyalty Programs

---

## Notes

- User stories are written from the perspective of end users
- Acceptance criteria define what "done" means
- Stories can be broken down into smaller tasks during sprint planning
- Stories should be testable and verifiable
- Stories may need to be refined based on user feedback

