# Console Component Relationships

This document describes the relationships and dependencies between components in the Console application.

## Component Dependency Graph

```
AppLayout (Root)
├── Header
│   ├── StoreSelector (ui/Select)
│   ├── SearchBar (data-display/SearchBar)
│   ├── Notifications (ui/Badge)
│   └── UserMenu (ui/Dropdown)
├── Sidebar
│   └── NavigationMenu
│       └── NavItem (ui/Button)
└── MainContentArea
    └── [Route Components]
        ├── Dashboard
        │   ├── StatsCard (ui/Card)
        │   ├── SalesChart (charts)
        │   └── RecentOrders (features/orders)
        ├── ProductsList
        │   ├── DataTable (data-display/DataTable)
        │   ├── SearchBar (data-display/SearchBar)
        │   ├── FilterBar (data-display/FilterBar)
        │   └── Pagination (data-display/Pagination)
        ├── ProductForm
        │   ├── FormField (forms/FormField)
        │   ├── FormInput (forms/FormInput)
        │   ├── FormSelect (forms/FormSelect)
        │   ├── ProductImageUpload (features/products/components)
        │   └── ProductCategorySelector (features/products/components)
        └── ProductDetail
            ├── Tabs (ui/Tabs)
            ├── Card (ui/Card)
            └── DataTable (data-display/DataTable)
```

## Base Component Dependencies

### Layout Components
- **AppLayout**: Depends on Sidebar, Header, Footer
- **Sidebar**: Depends on NavigationMenu, uses routing
- **Header**: Depends on StoreSelector, SearchBar, UserMenu
- **Footer**: Standalone, minimal dependencies

### UI Components
All UI components are independent and can be used anywhere:
- **Button**: No dependencies
- **Input**: No dependencies
- **Select**: Depends on Modal/Dropdown for options
- **Modal**: Depends on Button, uses portal
- **Table**: Depends on Button, Badge, Spinner
- **Card**: No dependencies
- **Badge**: No dependencies
- **Spinner**: No dependencies
- **Alert**: Depends on Button (for close)
- **Tabs**: No dependencies

### Form Components
All form components depend on React Hook Form:
- **FormField**: Wraps any input, adds label and error display
- **FormInput**: Uses Input component + FormField
- **FormSelect**: Uses Select component + FormField
- **FormTextarea**: Uses Textarea + FormField
- **FormCheckbox**: Uses Checkbox + FormField
- **FormDatePicker**: Uses DatePicker + FormField

### Data Display Components
- **DataTable**: Depends on TanStack Table, Button, Badge, Spinner
- **Pagination**: Depends on Button
- **SearchBar**: Depends on Input, Button
- **FilterBar**: Depends on Select, Input, Button, Badge

## Feature Component Dependencies

### Products Feature
```
ProductsList
├── DataTable (data-display)
├── SearchBar (data-display)
├── FilterBar (data-display)
└── ProductCard (features/products/components)
    └── Badge (ui)

ProductForm
├── FormField (forms)
├── FormInput (forms)
├── FormSelect (forms)
├── FormTextarea (forms)
├── ProductImageUpload (features/products/components)
│   └── Button (ui)
├── ProductCategorySelector (features/products/components)
│   └── FormSelect (forms)
└── ProductTagSelector (features/products/components)
    └── FormSelect (forms)

ProductDetail
├── Tabs (ui)
├── Card (ui)
├── DataTable (data-display)
└── ProductImageGallery (features/products/components)
    └── Modal (ui)
```

### Orders Feature
```
OrdersList
├── DataTable (data-display)
├── FilterBar (data-display)
└── OrderStatusBadge (features/orders/components)
    └── Badge (ui)

OrderDetail
├── Tabs (ui)
├── Card (ui)
├── OrderItemsTable (features/orders/components)
│   └── DataTable (data-display)
└── OrderPaymentHistory (features/orders/components)
    └── DataTable (data-display)
```

### Inventory Feature
```
InventoryEntriesList
├── DataTable (data-display)
└── FilterBar (data-display)

InventoryEntryForm
├── FormField (forms)
├── InventoryTransactionEditor (features/inventory/components)
│   ├── FormInput (forms)
│   ├── FormSelect (forms)
│   └── Button (ui)
└── InventoryStockView (features/inventory/components)
    └── DataTable (data-display)
```

## Shared Component Usage Patterns

### 1. List Pages
All list pages follow the same pattern:
```
[ListPage]
├── PageHeader (layout)
│   ├── Title
│   └── ActionButtons (ui/Button)
├── SearchBar (data-display)
├── FilterBar (data-display)
├── DataTable (data-display)
└── Pagination (data-display)
```

### 2. Form Pages
All form pages follow the same pattern:
```
[FormPage]
├── PageHeader (layout)
│   ├── Title
│   └── FormActions (ui/Button)
└── FormCard (ui/Card)
    └── [FormFields]
        ├── FormField (forms)
        └── [Specific Form Components]
```

### 3. Detail Pages
All detail pages follow the same pattern:
```
[DetailPage]
├── PageHeader (layout)
│   ├── Title
│   └── ActionButtons (ui/Button)
├── Tabs (ui)
└── TabPanels
    ├── OverviewCard (ui/Card)
    └── RelatedDataTable (data-display/DataTable)
```

## Component Composition Examples

### Example 1: Product Form with Image Upload
```tsx
<ProductForm>
  <FormField>
    <FormInput name="name" />
  </FormField>
  <FormField>
    <FormSelect name="category" />
  </FormField>
  <ProductImageUpload>
    <Button>Upload</Button>
    <Modal>
      <ImagePreview />
    </Modal>
  </ProductImageUpload>
</ProductForm>
```

### Example 2: Data Table with Actions
```tsx
<DataTable>
  <TableColumn>
    <Checkbox />
  </TableColumn>
  <TableColumn>Name</TableColumn>
  <TableColumn>
    <Button>Edit</Button>
    <Button>Delete</Button>
  </TableColumn>
</DataTable>
```

### Example 3: Filter Bar with Multiple Filters
```tsx
<FilterBar>
  <SelectFilter name="status" />
  <DateRangeFilter name="date" />
  <TextFilter name="search" />
  <Badge>Active Filters: 3</Badge>
  <Button>Clear All</Button>
</FilterBar>
```

## Hook Dependencies

### Custom Hooks
- **useAuth**: Provides authentication state and user info
- **usePermissions**: Checks user permissions for actions
- **useStore**: Provides current store context
- **useToast**: Shows toast notifications

### API Hooks (TanStack Query)
- **useStores**: Fetches stores list
- **useProducts**: Fetches products list
- **useOrders**: Fetches orders list
- etc.

## Component Communication Patterns

### 1. Parent-Child Communication
- Props down, events up
- Use callbacks for actions
- Use context for shared state

### 2. Sibling Communication
- Through shared parent state
- Through context (for global state)
- Through URL/route state

### 3. Cross-Feature Communication
- Through API/state management
- Through events (for loose coupling)
- Through shared context

## Best Practices

1. **Component Isolation**: Each component should be self-contained
2. **Prop Drilling Avoidance**: Use context for deeply nested props
3. **Reusability**: Extract common patterns into base components
4. **Composition over Inheritance**: Compose components rather than extend
5. **Single Responsibility**: Each component should have one clear purpose
6. **Type Safety**: Use TypeScript for all component props
7. **Documentation**: Document component props and usage

## Component Testing Strategy

### Unit Tests
- Test individual components in isolation
- Mock dependencies
- Test props, state changes, and events

### Integration Tests
- Test component interactions
- Test form submissions
- Test data flow

### E2E Tests
- Test complete user flows
- Test across multiple pages
- Test with real API calls (mocked)

