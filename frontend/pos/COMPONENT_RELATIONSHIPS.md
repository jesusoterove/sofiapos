# POS Component Relationships

This document describes the relationships and dependencies between components in the POS application.

## Component Dependency Graph

```
POSLayout (Root)
├── TopBar
│   ├── AppDetails
│   ├── UserDetails
│   ├── CurrentTime
│   └── ActionButtons
│       ├── LogoutButton
│       ├── CloseShiftButton
│       └── InventoryEntryButton
├── ProductSelectionPanel
│   ├── ScanButton
│   ├── SearchBar
│   ├── CategoryTabs
│   └── ProductList
│       └── ProductTile (multiple)
│           └── ProductImage
├── OrderDetailsPanel
│   ├── CustomerSelector
│   │   ├── CustomerDisplay
│   │   ├── CustomerLookupButton
│   │   └── NewCustomerButton
│   ├── OrderItemsList
│   │   └── OrderItem (multiple)
│   │       ├── QuantityControls
│   │       └── RemoveButton
│   ├── OrderTotals
│   └── OrderActions
│       ├── SaveDraftButton
│       ├── PayButton
│       └── CancelButton
└── BottomBar
    ├── ShiftStatus
    ├── CashRegisterStatus
    ├── SyncStatus
    └── SettingsButton

PaymentScreen (Modal)
├── PaymentMethodSelector
├── AmountPaidInput
│   └── NumericKeypad
├── ChangeDisplay
├── PaymentSummary
└── PaymentActions
    ├── CancelButton
    └── ProcessPaymentButton

TablesScreen
└── TablesGrid
    └── TableTile (multiple)
        └── TableStatusBadge
```

## Component Dependencies

### Layout Components

#### POSLayout
- **Dependencies**: TopBar, ProductSelectionPanel, OrderDetailsPanel, BottomBar
- **State Management**: usePOSState hook
- **Provides**: Layout context to children

#### TopBar
- **Dependencies**: AppDetails, UserDetails, CurrentTime, ActionButtons
- **State**: User info from useAuth, current time from hook
- **Actions**: Opens modals for logout, shift close, navigates to inventory

#### ProductSelectionPanel
- **Dependencies**: ScanButton, SearchBar, CategoryTabs, ProductList
- **State**: Products from useProducts query, selected category
- **Actions**: Adds products to order via useOrderManagement

#### OrderDetailsPanel
- **Dependencies**: CustomerSelector, OrderItemsList, OrderTotals, OrderActions
- **State**: Current order from useOrderManagement
- **Actions**: Updates order, processes payment

#### BottomBar
- **Dependencies**: ShiftStatus, CashRegisterStatus, SyncStatus, SettingsButton
- **State**: Shift status from useShift, cash register from useCashRegister, sync from useSync
- **Actions**: Opens related screens on click

### Product Components

#### ProductTile
- **Dependencies**: ProductImage, Button
- **Props**: Product data, onClick handler
- **Actions**: Adds product to order on click
- **State**: None (stateless)

#### ProductList
- **Dependencies**: ProductTile (multiple)
- **State**: Products list, selected category, search query
- **Rendering**: Grid or list view based on props

#### CategoryTabs
- **Dependencies**: Button (styled as tabs)
- **State**: Categories list, active category
- **Actions**: Changes active category, triggers product filter

### Order Components

#### OrderItem
- **Dependencies**: Button (quantity controls), Input (quantity display)
- **State**: Item quantity, unit price
- **Actions**: Updates quantity, removes item
- **Calculations**: Extended price = quantity × unit price

#### OrderItemsList
- **Dependencies**: OrderItem (multiple)
- **State**: Order items from order state
- **Rendering**: Scrollable list

#### OrderTotals
- **Dependencies**: None (display only)
- **Props**: Order totals (subtotal, taxes, discount, total)
- **Calculations**: Receives calculated values from parent

#### CustomerSelector
- **Dependencies**: Input, Button, Modal (for lookup)
- **State**: Selected customer
- **Actions**: Opens customer lookup modal, creates new customer

### Payment Components

#### PaymentScreen
- **Dependencies**: PaymentMethodSelector, AmountPaidInput, ChangeDisplay, PaymentSummary
- **State**: Payment method, amount paid, order totals
- **Calculations**: Change = amount paid - total
- **Actions**: Processes payment, prints receipt

#### PaymentMethodSelector
- **Dependencies**: Radio buttons
- **State**: Selected payment method (Cash or Bank Transfer only)
- **Options**: Limited to Cash and Bank Transfer

#### AmountPaidInput
- **Dependencies**: Input, NumericKeypad (modal)
- **State**: Amount paid value
- **Actions**: Opens numeric keypad on focus
- **Validation**: Must be >= order total

#### NumericKeypad
- **Dependencies**: Button (number buttons)
- **State**: Input value
- **Actions**: Appends digits, handles decimal, clears
- **Output**: Sends value to parent input

### Tables Components

#### TablesGrid
- **Dependencies**: TableTile (multiple)
- **State**: Tables list, filter state
- **Rendering**: Responsive grid layout

#### TableTile
- **Dependencies**: Badge (status), Button
- **Props**: Table data
- **Actions**: Navigates to table detail on click
- **Display**: Table number, name, status, capacity, location

## State Management Flow

### Order State Flow
```
useOrderManagement Hook
├── Current Order State
│   ├── Items Array
│   ├── Customer
│   └── Totals (calculated)
├── Actions
│   ├── addItem(product)
│   ├── updateQuantity(itemId, quantity)
│   ├── removeItem(itemId)
│   ├── setCustomer(customer)
│   └── clearOrder()
└── Calculations
    ├── calculateSubtotal()
    ├── calculateTaxes()
    ├── calculateDiscounts()
    └── calculateTotal()
```

### Product Selection Flow
```
useProductSelection Hook
├── Products State (from API/offline)
├── Filtered Products (computed)
│   ├── By Category
│   ├── By Search Query
│   └── By Availability
└── Actions
    ├── selectCategory(categoryId)
    ├── setSearchQuery(query)
    └── addToOrder(product)
```

### Payment Flow
```
PaymentScreen Component
├── Order Total (from order state)
├── Payment Method (state)
├── Amount Paid (state)
├── Change (calculated)
└── Process Payment
    ├── Validate payment
    ├── Create payment record
    ├── Update order status
    ├── Print receipt
    └── Clear order
```

## Component Communication Patterns

### 1. Parent-Child Communication
- **Props Down**: Data passed from parent to child
- **Callbacks Up**: Actions passed as callbacks
- **Example**: ProductTile receives product data and onClick callback

### 2. State Management
- **Global State**: Order state managed by useOrderManagement hook
- **Local State**: UI state (modals, dropdowns) managed locally
- **Shared State**: Shift, cash register status from context

### 3. Event Flow
```
User clicks ProductTile
  → onClick callback triggered
  → Calls addToOrder(product) from useOrderManagement
  → Order state updated
  → OrderItemsList re-renders
  → OrderTotals recalculates
  → UI updates
```

### 4. Modal Communication
```
User clicks Pay Button
  → Opens PaymentScreen modal
  → PaymentScreen receives order totals as props
  → User enters payment details
  → Clicks Process Payment
  → PaymentScreen calls onPaymentProcessed callback
  → Parent component handles payment processing
  → Modal closes
  → Order cleared
```

## Data Flow Examples

### Example 1: Adding Product to Order
```tsx
<ProductTile 
  product={product}
  onClick={() => addToOrder(product)}
/>

// In useOrderManagement hook:
const addToOrder = (product) => {
  const existingItem = order.items.find(i => i.productId === product.id);
  if (existingItem) {
    updateQuantity(existingItem.id, existingItem.quantity + 1);
  } else {
    setOrderItems([...order.items, {
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: product.sellingPrice,
      // ... other fields
    }]);
  }
  recalculateTotals();
};
```

### Example 2: Processing Payment
```tsx
<PaymentScreen
  orderTotal={order.total}
  onPaymentProcessed={handlePayment}
/>

const handlePayment = async (paymentData) => {
  // Validate payment
  if (paymentData.amountPaid < order.total) {
    showError('Insufficient payment');
    return;
  }
  
  // Create payment record
  const payment = await createPayment({
    orderId: order.id,
    paymentMethod: paymentData.method,
    amount: paymentData.amountPaid,
  });
  
  // Update order status
  await updateOrder(order.id, { status: 'paid' });
  
  // Print receipt
  await printReceipt(order.id);
  
  // Clear order
  clearOrder();
  
  // Close modal
  closePaymentScreen();
};
```

### Example 3: Offline Sync
```tsx
// Order created offline
const createOrderOffline = async (orderData) => {
  // Save to SQLite (relational data)
  await sqlite.run(`
    INSERT INTO orders (id, store_id, order_number, status, total, sync_status, created_at)
    VALUES (?, ?, ?, ?, ?, 'pending', ?)
  `, [orderData.id, orderData.storeId, orderData.orderNumber, 'draft', orderData.total, new Date()]);
  
  // Save order items
  for (const item of orderData.items) {
    await sqlite.run(`
      INSERT INTO order_items (order_id, product_id, quantity, unit_price, total)
      VALUES (?, ?, ?, ?, ?)
    `, [orderData.id, item.productId, item.quantity, item.unitPrice, item.total]);
  }
  
  // Add to sync queue (IndexedDB for simple key-value)
  await syncQueue.add({
    type: 'order',
    action: 'create',
    dataId: orderData.id,
  });
  
  // Update sync status
  updateSyncStatus('pending', await syncQueue.count());
};

// When online, sync runs
const syncOrders = async () => {
  // Get pending orders from SQLite
  const pendingOrders = await sqlite.query(`
    SELECT * FROM orders WHERE sync_status = 'pending'
  `);
  
  for (const order of pendingOrders) {
    try {
      // Get order with items
      const orderWithItems = await sqlite.query(`
        SELECT o.*, oi.* 
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.id = ?
      `, [order.id]);
      
      // Sync to backend
      await api.orders.create(orderWithItems);
      
      // Update sync status in SQLite
      await sqlite.run(`
        UPDATE orders SET sync_status = 'synced' WHERE id = ?
      `, [order.id]);
      
      // Remove from sync queue
      await syncQueue.remove(order.id);
    } catch (error) {
      // Handle error, keep in queue
      console.error('Sync failed:', error);
    }
  }
};
```

## Best Practices

1. **Component Isolation**: Each component should be self-contained
2. **State Lifting**: Lift state to appropriate level (order state at POSLayout level)
3. **Callback Props**: Use callbacks for parent-child communication
4. **Context for Global State**: Use context for shift, cash register status
5. **Hooks for Logic**: Extract business logic into custom hooks
6. **Memoization**: Memoize expensive calculations and components
7. **Offline First**: Design for offline functionality from the start
8. **Error Handling**: Handle errors gracefully with user feedback
9. **Loading States**: Show loading indicators during async operations
10. **Optimistic Updates**: Update UI optimistically, sync in background

## Component Testing Strategy

### Unit Tests
- Test individual components in isolation
- Mock dependencies and callbacks
- Test props, state changes, and events

### Integration Tests
- Test component interactions
- Test order flow (add item, update quantity, process payment)
- Test offline sync functionality

### E2E Tests
- Test complete order flow
- Test payment processing
- Test offline/online sync
- Test with real device (touch interactions)

## Performance Optimization

1. **Virtual Scrolling**: For large product lists
2. **Lazy Loading**: Load products on demand
3. **Memoization**: Memoize calculated values (totals, filtered products)
4. **Debouncing**: Debounce search input
5. **Image Optimization**: Lazy load product images
6. **Code Splitting**: Split routes and large components
7. **Service Worker**: Cache assets and API responses

