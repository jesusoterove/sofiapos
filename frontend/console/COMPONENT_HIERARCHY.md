# Console Component Hierarchy

This document defines the component hierarchy and layout structure for the SofiaPOS Console (Administration App).

## Overview

The Console is a web-based administration system for managing all aspects of the restaurant/food business. It uses a modular component architecture with reusable components to maintain clean code and separation of concerns.

## Technology Stack

- **Framework**: React
- **Routing**: TanStack Router
- **Data Fetching**: TanStack Query
- **Tables**: TanStack Table
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form
- **Notifications**: React Toastify
- **Icons**: React Icons

## Folder Structure

```
frontend/console/
├── src/
│   ├── app/                      # App-level configuration
│   │   ├── router.tsx            # Route definitions
│   │   └── queryClient.tsx      # TanStack Query client
│   ├── components/               # Reusable components
│   │   ├── layout/              # Layout components
│   │   │   ├── AppLayout.tsx    # Main app layout wrapper
│   │   │   ├── Sidebar.tsx      # Navigation sidebar
│   │   │   ├── Header.tsx       # Top header bar
│   │   │   └── Footer.tsx       # Footer component
│   │   ├── ui/                  # Base UI components
│   │   │   ├── Button.tsx       # Button component
│   │   │   ├── Input.tsx        # Input component
│   │   │   ├── Select.tsx       # Select dropdown
│   │   │   ├── Modal.tsx        # Modal dialog
│   │   │   ├── Table.tsx        # Table wrapper
│   │   │   ├── Card.tsx         # Card container
│   │   │   ├── Badge.tsx        # Badge component
│   │   │   ├── Spinner.tsx      # Loading spinner
│   │   │   ├── Alert.tsx        # Alert/notification
│   │   │   └── Tabs.tsx         # Tab component
│   │   ├── forms/               # Form components
│   │   │   ├── FormField.tsx    # Form field wrapper
│   │   │   ├── FormSelect.tsx   # Select form field
│   │   │   ├── FormInput.tsx    # Input form field
│   │   │   ├── FormTextarea.tsx # Textarea form field
│   │   │   ├── FormCheckbox.tsx # Checkbox form field
│   │   │   └── FormDatePicker.tsx # Date picker field
│   │   └── data-display/        # Data display components
│   │       ├── DataTable.tsx    # Generic data table
│   │       ├── Pagination.tsx   # Pagination controls
│   │       ├── SearchBar.tsx    # Search input
│   │       └── FilterBar.tsx    # Filter controls
│   ├── features/                # Feature modules
│   │   ├── dashboard/           # Dashboard feature
│   │   │   ├── Dashboard.tsx
│   │   │   └── components/
│   │   │       ├── StatsCard.tsx
│   │   │       ├── RecentOrders.tsx
│   │   │       └── SalesChart.tsx
│   │   ├── stores/              # Store management
│   │   │   ├── StoresList.tsx
│   │   │   ├── StoreForm.tsx
│   │   │   ├── StoreDetail.tsx
│   │   │   └── components/
│   │   │       └── StoreCard.tsx
│   │   ├── users/               # User management
│   │   │   ├── UsersList.tsx
│   │   │   ├── UserForm.tsx
│   │   │   ├── UserDetail.tsx
│   │   │   └── components/
│   │   │       └── UserRoleSelector.tsx
│   │   ├── roles/               # Role & Permission management
│   │   │   ├── RolesList.tsx
│   │   │   ├── RoleForm.tsx
│   │   │   ├── RoleDetail.tsx
│   │   │   └── components/
│   │   │       ├── PermissionMatrix.tsx
│   │   │       └── PermissionSelector.tsx
│   │   ├── products/            # Product management
│   │   │   ├── ProductsList.tsx
│   │   │   ├── ProductForm.tsx
│   │   │   ├── ProductDetail.tsx
│   │   │   └── components/
│   │   │       ├── ProductImageUpload.tsx
│   │   │       ├── ProductCategorySelector.tsx
│   │   │       ├── ProductTagSelector.tsx
│   │   │       └── ProductUnitOfMeasureEditor.tsx
│   │   ├── materials/           # Material management
│   │   │   ├── MaterialsList.tsx
│   │   │   ├── MaterialForm.tsx
│   │   │   ├── MaterialDetail.tsx
│   │   │   └── components/
│   │   │       └── MaterialUnitOfMeasureEditor.tsx
│   │   ├── recipes/             # Recipe management
│   │   │   ├── RecipesList.tsx
│   │   │   ├── RecipeForm.tsx
│   │   │   ├── RecipeDetail.tsx
│   │   │   └── components/
│   │   │       ├── RecipeMaterialEditor.tsx
│   │   │       └── RecipeYieldEditor.tsx
│   │   ├── categories/          # Category management
│   │   │   ├── CategoriesList.tsx
│   │   │   ├── CategoryForm.tsx
│   │   │   └── components/
│   │   │       └── CategoryTree.tsx
│   │   ├── tags/                # Tag management
│   │   │   ├── TagsList.tsx
│   │   │   └── TagForm.tsx
│   │   ├── taxes/               # Tax management
│   │   │   ├── TaxesList.tsx
│   │   │   ├── TaxForm.tsx
│   │   │   └── components/
│   │   │       └── ProductTaxAssigner.tsx
│   │   ├── discounts/           # Discount management
│   │   │   ├── DiscountsList.tsx
│   │   │   └── DiscountForm.tsx
│   │   ├── vendors/             # Vendor management
│   │   │   ├── VendorsList.tsx
│   │   │   ├── VendorForm.tsx
│   │   │   └── VendorDetail.tsx
│   │   ├── customers/           # Customer management
│   │   │   ├── CustomersList.tsx
│   │   │   ├── CustomerForm.tsx
│   │   │   └── CustomerDetail.tsx
│   │   ├── inventory/           # Inventory management
│   │   │   ├── InventoryEntriesList.tsx
│   │   │   ├── InventoryEntryForm.tsx
│   │   │   ├── InventoryEntryDetail.tsx
│   │   │   └── components/
│   │   │       ├── InventoryTransactionEditor.tsx
│   │   │       └── InventoryStockView.tsx
│   │   ├── orders/              # Order management
│   │   │   ├── OrdersList.tsx
│   │   │   ├── OrderDetail.tsx
│   │   │   └── components/
│   │   │       ├── OrderItemsTable.tsx
│   │   │       └── OrderPaymentHistory.tsx
│   │   ├── payments/            # Payment management
│   │   │   ├── PaymentsList.tsx
│   │   │   └── PaymentDetail.tsx
│   │   ├── payment-methods/     # Payment method configuration
│   │   │   ├── PaymentMethodsList.tsx
│   │   │   └── PaymentMethodForm.tsx
│   │   ├── cash-registers/      # Cash register management
│   │   │   ├── CashRegistersList.tsx
│   │   │   ├── CashRegisterDetail.tsx
│   │   │   └── components/
│   │   │       └── CashRegisterHistoryTable.tsx
│   │   ├── shifts/              # Shift management
│   │   │   ├── ShiftsList.tsx
│   │   │   ├── ShiftDetail.tsx
│   │   │   └── components/
│   │   │       └── ShiftUsersManager.tsx
│   │   ├── tables/              # Table management
│   │   │   ├── TablesList.tsx
│   │   │   ├── TableForm.tsx
│   │   │   └── components/
│   │   │       └── TablesGrid.tsx
│   │   ├── reports/             # Reports
│   │   │   ├── ReportsList.tsx
│   │   │   └── components/
│   │   │       ├── SalesReport.tsx
│   │   │       ├── InventoryReport.tsx
│   │   │       ├── ProductSalesReport.tsx
│   │   │       └── ShiftReport.tsx
│   │   ├── settings/            # Settings
│   │   │   ├── SettingsList.tsx
│   │   │   ├── SettingsForm.tsx
│   │   │   └── components/
│   │   │       ├── StoreSettings.tsx
│   │   │       └── SystemSettings.tsx
│   │   └── unit-of-measures/    # Unit of measure management
│   │       ├── UnitOfMeasuresList.tsx
│   │       └── UnitOfMeasureForm.tsx
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAuth.tsx          # Authentication hook
│   │   ├── usePermissions.tsx   # Permission checking hook
│   │   ├── useStore.tsx         # Store context hook
│   │   └── useToast.tsx         # Toast notification hook
│   ├── api/                     # API client and queries
│   │   ├── client.ts            # API client setup
│   │   └── queries/             # TanStack Query hooks
│   │       ├── stores.ts
│   │       ├── users.ts
│   │       ├── products.ts
│   │       └── ... (one file per feature)
│   ├── utils/                   # Utility functions
│   │   ├── format.ts            # Formatting utilities
│   │   ├── validation.ts        # Validation schemas
│   │   └── constants.ts         # Constants
│   ├── types/                   # TypeScript types
│   │   ├── api.ts               # API response types
│   │   ├── models.ts            # Data model types
│   │   └── routes.ts            # Route types
│   ├── i18n/                    # Internationalization
│   │   ├── index.ts             # i18n setup
│   │   ├── locales/
│   │   │   ├── en/
│   │   │   │   └── translation.json
│   │   │   └── es/
│   │   │       └── translation.json
│   │   └── hooks.ts             # useTranslation hook
│   ├── hooks-system/            # Hook system for customization
│   │   ├── index.ts             # Hook registry
│   │   ├── types.ts              # Hook type definitions
│   │   └── hooks/                # Built-in hooks
│   │       ├── product-hooks.ts
│   │       └── order-hooks.ts
│   └── main.tsx                 # Application entry point
├── public/                      # Static assets
├── package.json
├── tsconfig.json
├── vite.config.ts              # Vite configuration
└── tailwind.config.js          # Tailwind configuration
```

## Layout Structure

### Main Layout (AppLayout)

```
┌─────────────────────────────────────────────────────────┐
│                    Header                                │
│  [Logo] [Store Selector] [User Menu] [Notifications]    │
├──────────┬──────────────────────────────────────────────┤
│          │                                               │
│ Sidebar  │              Main Content Area               │
│          │                                               │
│ • Dashboard│                                             │
│ • Stores  │                                             │
│ • Users   │                                             │
│ • Products│                                             │
│ • ...     │                                             │
│          │                                               │
│          │                                               │
├──────────┴──────────────────────────────────────────────┤
│                    Footer                               │
└─────────────────────────────────────────────────────────┘
```

### Page Layout Structure

Each feature page follows a consistent structure:

```
┌─────────────────────────────────────────────────────────┐
│  Page Header                                             │
│  [Title] [Breadcrumbs] [Action Buttons]                 │
├─────────────────────────────────────────────────────────┤
│  Filters/Search Bar                                      │
├─────────────────────────────────────────────────────────┤
│  Content Area                                            │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Data Table / Form / Detail View                    │ │
│  │                                                     │ │
│  │                                                     │ │
│  └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│  Pagination / Footer Actions                            │
└─────────────────────────────────────────────────────────┘
```

## Component Categories

### 1. Layout Components
- **AppLayout**: Main application wrapper with sidebar and header
- **Sidebar**: Navigation menu with collapsible sections
- **Header**: Top bar with user info, notifications, store selector
- **Footer**: Application footer

### 2. Base UI Components
Reusable components that can be used throughout the application:
- **Button**: Standardized button with variants (primary, secondary, danger, etc.)
- **Input**: Text input with validation states
- **Select**: Dropdown select component
- **Modal**: Dialog/modal component
- **Table**: Table wrapper with sorting, filtering, pagination
- **Card**: Container card component
- **Badge**: Status badge component
- **Spinner**: Loading indicator
- **Alert**: Alert/notification component
- **Tabs**: Tab navigation component

### 3. Form Components
Form components integrated with React Hook Form:
- **FormField**: Wrapper for form fields with label and error display
- **FormInput**: Text input field
- **FormSelect**: Select dropdown field
- **FormTextarea**: Textarea field
- **FormCheckbox**: Checkbox field
- **FormDatePicker**: Date picker field

### 4. Data Display Components
- **DataTable**: Generic table component using TanStack Table
- **Pagination**: Pagination controls
- **SearchBar**: Search input with debouncing
- **FilterBar**: Advanced filter controls

### 5. Feature Components
Feature-specific components organized by domain:
- Each feature module contains:
  - List view component
  - Form component (create/edit)
  - Detail view component
  - Feature-specific sub-components

## Navigation Structure

### Main Navigation Menu

1. **Dashboard** (`/`)
   - Overview statistics
   - Recent orders
   - Sales charts

2. **Stores** (`/stores`)
   - Store list
   - Store management
   - Store settings

3. **Users** (`/users`)
   - User list
   - User management
   - User roles assignment

4. **Roles & Permissions** (`/roles`)
   - Role list
   - Role management
   - Permission matrix

5. **Products** (`/products`)
   - Product list
   - Product management
   - Product images
   - Product categories
   - Product tags

6. **Materials** (`/materials`)
   - Material list
   - Material management
   - Unit of measure configuration

7. **Recipes** (`/recipes`)
   - Recipe list
   - Recipe management
   - Recipe materials editor

8. **Categories** (`/categories`)
   - Category tree
   - Category management

9. **Tags** (`/tags`)
   - Tag list
   - Tag management

10. **Taxes** (`/taxes`)
    - Tax list
    - Tax management
    - Product tax assignment

11. **Discounts** (`/discounts`)
    - Discount list
    - Discount management

12. **Vendors** (`/vendors`)
    - Vendor list
    - Vendor management

13. **Customers** (`/customers`)
    - Customer list
    - Customer management

14. **Inventory** (`/inventory`)
    - Inventory entries
    - Stock levels
    - Inventory transactions

15. **Orders** (`/orders`)
    - Order list
    - Order details
    - Payment history

16. **Payments** (`/payments`)
    - Payment list
    - Payment details

17. **Payment Methods** (`/payment-methods`)
    - Payment method configuration

18. **Cash Registers** (`/cash-registers`)
    - Cash register list
    - Cash register history
    - Open/close management

19. **Shifts** (`/shifts`)
    - Shift list
    - Shift details
    - Shift user management

20. **Tables** (`/tables`)
    - Table list
    - Table management
    - Table grid view

21. **Reports** (`/reports`)
    - Sales reports
    - Inventory reports
    - Product sales reports
    - Shift reports

22. **Settings** (`/settings`)
    - System settings
    - Store settings
    - Application configuration

23. **Unit of Measures** (`/unit-of-measures`)
    - Unit of measure list
    - Unit of measure management

## Component Reusability Guidelines

### 1. Base Components
- Should be generic and reusable
- Accept props for customization
- Follow consistent naming conventions
- Include proper TypeScript types

### 2. Feature Components
- Should be specific to their feature domain
- Can use base components internally
- Should be self-contained when possible
- Can be composed with other feature components

### 3. Form Components
- Should integrate with React Hook Form
- Include validation
- Show error states
- Support disabled/readonly states

### 4. Data Table Components
- Use TanStack Table for consistency
- Support sorting, filtering, pagination
- Include action buttons (edit, delete, view)
- Support bulk actions when applicable

## Responsive Design

The console should be responsive with breakpoints:
- **Mobile**: < 768px (collapsed sidebar, stacked layout)
- **Tablet**: 768px - 1024px (collapsible sidebar)
- **Desktop**: > 1024px (full sidebar, multi-column layouts)

## Accessibility

- All interactive elements should be keyboard accessible
- Proper ARIA labels and roles
- Focus management in modals
- Screen reader support
- Color contrast compliance

## Performance Considerations

- Lazy loading for routes
- Code splitting by feature
- Memoization for expensive components
- Virtual scrolling for large lists
- Optimistic updates for better UX

