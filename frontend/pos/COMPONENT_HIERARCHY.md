# POS Component Hierarchy

This document defines the component hierarchy and layout structure for the SofiaPOS Point of Sale (POS) application.

## Overview

The POS is a standalone application that can be installed on a computer or mobile device. It works offline and syncs with the administration system. The interface is optimized for fast, touch-friendly operations in a retail/restaurant environment.

## Technology Stack

- **Framework**: React
- **Routing**: TanStack Router
- **Data Fetching**: TanStack Query
- **State Management**: TanStack Query + IndexedDB (for offline)
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form
- **Notifications**: React Toastify
- **Icons**: React Icons
- **Offline Support**: Service Worker + IndexedDB (for MVP scale: 100 products, 20-30 items per order)

## Folder Structure

```
frontend/pos/
├── src/
│   ├── app/                      # App-level configuration
│   │   ├── router.tsx            # Route definitions
│   │   ├── queryClient.tsx       # TanStack Query client
│   │   └── offline.ts            # Offline sync configuration
│   ├── components/               # Reusable components
│   │   ├── layout/              # Layout components
│   │   │   ├── POSLayout.tsx    # Main POS layout wrapper
│   │   │   ├── TopBar.tsx       # Top bar component
│   │   │   ├── BottomBar.tsx    # Bottom bar component
│   │   │   └── AppDetails.tsx    # App name/logo display
│   │   ├── ui/                  # Base UI components
│   │   │   ├── Button.tsx       # Button component (touch-friendly)
│   │   │   ├── Input.tsx        # Input component
│   │   │   ├── Modal.tsx        # Modal dialog
│   │   │   ├── Card.tsx         # Card container
│   │   │   ├── Badge.tsx        # Badge component
│   │   │   ├── Spinner.tsx      # Loading spinner
│   │   │   ├── Toast.tsx        # Toast notification
│   │   │   └── NumericKeypad.tsx # Numeric keypad
│   │   ├── product-selection/   # Product selection components
│   │   │   ├── ProductSelectionPanel.tsx
│   │   │   ├── ScanButton.tsx   # Barcode scanner button
│   │   │   ├── SearchBar.tsx     # Product search
│   │   │   ├── CategoryTabs.tsx # Scrollable category tabs
│   │   │   ├── ProductList.tsx  # Product list/tiles
│   │   │   ├── ProductTile.tsx  # Individual product tile
│   │   │   └── ProductListView.tsx # List view variant
│   │   ├── order/               # Order components
│   │   │   ├── OrderDetailsPanel.tsx
│   │   │   ├── CustomerSelector.tsx
│   │   │   ├── OrderItemsList.tsx
│   │   │   ├── OrderItem.tsx
│   │   │   ├── OrderTotals.tsx
│   │   │   └── OrderActions.tsx
│   │   ├── payment/              # Payment components
│   │   │   ├── PaymentScreen.tsx
│   │   │   ├── PaymentMethodSelector.tsx
│   │   │   ├── PaymentAmountInput.tsx
│   │   │   ├── ChangeDisplay.tsx
│   │   │   └── PaymentSummary.tsx
│   │   ├── tables/              # Table management components
│   │   │   ├── TablesGrid.tsx
│   │   │   ├── TableTile.tsx
│   │   │   └── TableStatusBadge.tsx
│   │   └── shift/               # Shift management components
│   │       ├── ShiftStatus.tsx
│   │       ├── ShiftOpenModal.tsx
│   │       └── ShiftCloseModal.tsx
│   ├── features/                # Feature modules
│   │   ├── pos-screen/          # Main POS screen
│   │   │   ├── POSScreen.tsx
│   │   │   └── hooks/
│   │   │       ├── useProductSelection.ts
│   │   │       ├── useOrderManagement.ts
│   │   │       └── usePOSState.ts
│   │   ├── tables/              # Table management
│   │   │   ├── TablesScreen.tsx
│   │   │   ├── TableDetail.tsx
│   │   │   └── components/
│   │   │       └── TableOrderList.tsx
│   │   ├── shift/               # Shift management
│   │   │   ├── ShiftScreen.tsx
│   │   │   ├── ShiftOpen.tsx
│   │   │   ├── ShiftClose.tsx
│   │   │   └── components/
│   │   │       ├── ShiftUsersManager.tsx
│   │   │       └── InventoryCount.tsx
│   │   ├── inventory/           # Inventory entry
│   │   │   ├── InventoryEntryScreen.tsx
│   │   │   ├── InventoryEntryForm.tsx
│   │   │   └── components/
│   │   │       └── InventoryTransactionEditor.tsx
│   │   ├── cash-register/      # Cash register management
│   │   │   ├── CashRegisterScreen.tsx
│   │   │   ├── CashRegisterOpen.tsx
│   │   │   └── CashRegisterClose.tsx
│   │   └── sync/                # Offline sync
│   │       ├── SyncStatus.tsx
│   │       ├── SyncManager.ts
│   │       └── SyncQueue.ts
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAuth.tsx          # Authentication hook
│   │   ├── useShift.tsx         # Current shift hook
│   │   ├── useCashRegister.tsx  # Cash register hook
│   │   ├── useOffline.tsx       # Offline status hook
│   │   ├── useSync.tsx          # Sync operations hook
│   │   └── useBarcodeScanner.tsx # Barcode scanner hook
│   ├── db/                      # Database layer (IndexedDB)
│   │   ├── indexeddb.ts         # IndexedDB setup
│   │   ├── schema.ts            # Database schema definitions
│   │   └── queries/             # Query functions
│   │       ├── products.ts
│   │       ├── orders.ts
│   │       ├── inventory.ts
│   │       └── customers.ts
│   ├── api/                     # API client and queries
│   │   ├── client.ts            # API client setup
│   │   ├── sync.ts              # Sync manager
│   │   └── queries/             # TanStack Query hooks
│   │       ├── products.ts
│   │       ├── orders.ts
│   │       ├── shifts.ts
│   │       └── sync.ts
│   ├── utils/                   # Utility functions
│   │   ├── format.ts            # Formatting utilities
│   │   ├── calculation.ts       # Price calculations
│   │   ├── barcode.ts           # Barcode utilities
│   │   └── constants.ts         # Constants
│   ├── types/                   # TypeScript types
│   │   ├── api.ts               # API response types
│   │   ├── models.ts            # Data model types
│   │   └── pos.ts               # POS-specific types
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
│   │       ├── order-hooks.ts
│   │       └── payment-hooks.ts
│   └── main.tsx                 # Application entry point
├── public/                      # Static assets
├── package.json
├── tsconfig.json
├── vite.config.ts              # Vite configuration
└── tailwind.config.js          # Tailwind configuration
```

## Main POS Screen Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                         TOP BAR                                  │
│  [App Logo/Name] [User] [Time] [Logout] [Close Shift] [Inventory]│
├──────────────────────────┬──────────────────────────────────────┤
│                          │                                      │
│                          │         ORDER DETAILS PANEL          │
│                          │  ┌────────────────────────────────┐  │
│                          │  │ Customer: [Name] [Lookup] [New]│  │
│                          │  ├────────────────────────────────┤  │
│                          │  │ Order Items:                   │  │
│                          │  │ ┌────────────────────────────┐ │  │
│                          │  │ │ Item 1    Qty: [2]  $10.00│ │  │
│                          │  │ │ Item 2    Qty: [1]  $5.00 │ │  │
│                          │  │ └────────────────────────────┘ │  │
│                          │  ├────────────────────────────────┤  │
│                          │  │ Subtotal: $15.00               │  │
│                          │  │ Taxes:    $2.40                │  │
│                          │  │ Discount: $0.00                │  │
│                          │  │ Total:    $17.40               │  │
│                          │  ├────────────────────────────────┤  │
│                          │  │ [Save Draft] [Pay] [Cancel]    │  │
│                          │  └────────────────────────────────┘  │
│  PRODUCT SELECTION        │                                      │
│  ┌────────────────────┐  │                                      │
│  │ [Scan] [Search...] │  │                                      │
│  ├────────────────────┤  │                                      │
│  │ [Cat1][Cat2][Cat3] │  │                                      │
│  ├────────────────────┤  │                                      │
│  │ ┌──┐ ┌──┐ ┌──┐     │  │                                      │
│  │ │P1│ │P2│ │P3│     │  │                                      │
│  │ └──┘ └──┘ └──┘     │  │                                      │
│  │ ┌──┐ ┌──┐ ┌──┐     │  │                                      │
│  │ │P4│ │P5│ │P6│     │  │                                      │
│  │ └──┘ └──┘ └──┘     │  │                                      │
│  │ ...                │  │                                      │
│  └────────────────────┘  │                                      │
├──────────────────────────┴──────────────────────────────────────┤
│                         BOTTOM BAR                               │
│  [Shift Status] [Cash Register] [Sync Status] [Settings]        │
└─────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### TopBar Component

**Location**: Top of POS screen
**Purpose**: Display app info, user details, time, and quick actions

**Elements**:
- **Left Section**: App Details (Logo/Name + Version)
- **Center Section**: User Details (Username)
- **Right Section**: Current Time (live clock)
- **Action Buttons**:
  - Logout
  - Close Shift
  - Inventory Entry

**Behavior**:
- Fixed position at top
- Responsive: collapses on mobile
- Action buttons show modals/confirmations

### ProductSelectionPanel Component

**Location**: Left side of main content area
**Purpose**: Product browsing and selection

**Structure**:
1. **Scan Button**: Opens barcode scanner or input
2. **Search Bar**: Real-time product search
3. **Category Tabs**: Horizontal scrollable tabs
4. **Product List/Tiles**: Grid or list view of products

**Product Tile/View**:
- Product image (or generic placeholder)
- Product name
- Description (truncated)
- Price
- Quantity available (if inventory tracked)
- Add to cart button

**Behavior**:
- Scrollable product list
- Touch-friendly tiles (min 120x120px)
- Quick add to cart on tile click
- Visual feedback on selection
- Supports both grid and list views

### OrderDetailsPanel Component

**Location**: Right side of main content area
**Purpose**: Display and manage current order

**Structure**:
1. **Customer Selector Bar**:
   - Default customer name display
   - Lookup button (opens customer search)
   - New customer button

2. **Order Items List**:
   - Scrollable list of order items
   - Each item shows:
     - Product name
     - Description
     - Quantity (with +/- buttons)
     - Unit price
     - Extended price
     - Remove button

3. **Order Totals**:
   - Subtotal
   - Taxes (breakdown)
   - Discounts
   - Total

4. **Action Buttons**:
   - Save Draft
   - Pay (opens payment screen)
   - Cancel Order
   - Print Receipt (if paid)

**Behavior**:
- Real-time total calculation
- Quantity adjustment with +/- buttons
- Click quantity to edit directly
- Remove item confirmation
- Auto-save draft periodically

### BottomBar Component

**Location**: Bottom of POS screen
**Purpose**: Display status and quick access

**Elements**:
- Shift status indicator
- Cash register status
- Sync status (online/offline, pending sync count)
- Settings button

**Behavior**:
- Fixed position at bottom
- Status indicators update in real-time
- Click status to open related screen

## Payment Screen Layout

```
┌─────────────────────────────────────────────────────────┐
│                    PAYMENT SCREEN                        │
├─────────────────────────────────────────────────────────┤
│  Order Total: $17.40                                    │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐           │
│  │ Payment Method   │  │ Amount Paid      │           │
│  │                  │  │                  │           │
│  │ ○ Cash           │  │ $ [20.00]       │           │
│  │ ○ Bank Transfer  │  │                  │           │
│  │                  │  │                  │           │
│  └──────────────────┘  └──────────────────┘           │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐ │
│  │ Change: $2.60                                     │ │
│  └──────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐ │
│  │ Payment Summary                                  │ │
│  │ ──────────────────────────────────────────────── │ │
│  │ Subtotal: $15.00                                 │ │
│  │ Taxes:    $2.40                                  │ │
│  │ Total:    $17.40                                 │ │
│  │ Paid:     $20.00                                 │ │
│  │ Change:   $2.60                                  │ │
│  └──────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│  [Cancel]                    [Process Payment]         │
└─────────────────────────────────────────────────────────┘
```

### PaymentScreen Component

**Structure**:
1. **Order Total Display**: Large, prominent display
2. **Payment Method Selection**: Radio buttons (Cash or Bank Transfer only)
3. **Amount Paid Input**: Numeric input with keypad
4. **Change Display**: Calculated change amount
5. **Payment Summary**: Detailed breakdown
6. **Action Buttons**: Cancel and Process Payment

**Behavior**:
- Only Cash and Bank Transfer methods allowed
- Real-time change calculation
- Numeric keypad for amount input
- Validation before processing
- Receipt printing after successful payment

## Tables Screen Layout

```
┌─────────────────────────────────────────────────────────┐
│                    TABLES SCREEN                        │
├─────────────────────────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │
│  │Table │ │Table │ │Table │ │Table │ │Table │        │
│  │  1   │ │  2   │ │  3   │ │  4   │ │  5   │        │
│  │      │ │      │ │      │ │      │ │      │        │
│  │ Open │ │Closed│ │ Open │ │Closed│ │ Open │        │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘        │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │
│  │Table │ │Table │ │Table │ │Table │ │Table │        │
│  │  6   │ │  7   │ │  8   │ │  9   │ │ 10   │        │
│  │      │ │      │ │      │ │      │ │      │        │
│  │Closed│ │ Open │ │Closed│ │ Open │ │Closed│        │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘        │
└─────────────────────────────────────────────────────────┘
```

### TablesGrid Component

**Structure**:
- Grid layout of table tiles
- Each tile shows:
  - Table number
  - Table name
  - Status (Open/Closed)
  - Order status (if open)
  - Capacity
  - Location

**Behavior**:
- Click tile to view table details
- Color coding for status
- Responsive grid (adjusts columns based on screen size)

## Component Specifications

### Touch-Friendly Design

All interactive elements should be:
- **Minimum size**: 44x44px (iOS) / 48x48px (Android)
- **Spacing**: Minimum 8px between touch targets
- **Visual feedback**: Clear hover/active states
- **Loading states**: Spinners or skeleton screens

### Product Tile Component

**Size**: 
- Grid view: 120x120px minimum
- List view: Full width, 80px height

**Content**:
- Image (80x80px) or placeholder
- Product name (truncated if long)
- Price (prominent)
- Stock indicator (if applicable)
- Add button

**Interactions**:
- Tap tile: Add 1 to cart
- Long press: Show product details
- Swipe: Quick actions (if applicable)

### Order Item Component

**Size**: Full width, minimum 80px height

**Content**:
- Product name
- Description (optional)
- Quantity controls (+/- buttons)
- Unit price
- Extended price
- Remove button

**Interactions**:
- Tap quantity: Open quantity editor
- +/- buttons: Adjust quantity
- Swipe left: Remove item (with confirmation)

### Numeric Keypad Component

**Layout**: 3x4 grid
```
┌─────┬─────┬─────┐
│  7  │  8  │  9  │
├─────┼─────┼─────┤
│  4  │  5  │  6  │
├─────┼─────┼─────┤
│  1  │  2  │  3  │
├─────┼─────┼─────┤
│  .  │  0  │  ←  │
└─────┴─────┴─────┘
```

**Behavior**:
- Large, touch-friendly buttons
- Haptic feedback (if available)
- Clear button (backspace)
- Decimal point support

## Responsive Design

### Desktop (> 1024px)
- Full layout with sidebar
- Product tiles: 4-5 columns
- Order panel: Fixed width (400px)

### Tablet (768px - 1024px)
- Product tiles: 3 columns
- Order panel: Fixed width (350px)
- Bottom bar: Always visible

### Mobile (< 768px)
- Stacked layout:
  - Top bar: Full width
  - Product selection: Full width (collapsible)
  - Order panel: Full width (overlay or bottom sheet)
  - Bottom bar: Always visible
- Product tiles: 2 columns
- Touch-optimized controls

## Offline Functionality

### Offline Indicators
- Visual indicator in bottom bar
- Sync queue count badge
- Warning toast when offline

### Offline Behavior
- All operations work offline
- Data stored in IndexedDB (optimized for MVP scale: 100 products, 20-30 items per order)
- Sync queue for pending operations
- Automatic sync when online
- Manual sync button

### Storage Strategy (MVP)
- **IndexedDB**: All data (Products, Orders, Inventory, Customers, Sync Queue)
- **LocalStorage**: User preferences, settings
- **Future**: Can migrate to SQLite if scale increases significantly

### Sync Queue
- Orders created offline
- Inventory entries
- Cash register operations
- Shift operations
- Stored in IndexedDB with sync status tracking

## Performance Considerations

- **Lazy loading**: Load products on demand
- **Virtual scrolling**: For large product lists
- **Image optimization**: Lazy load product images
- **Debounced search**: 300ms delay
- **Memoization**: Expensive calculations cached
- **Service Worker**: Offline caching

## Accessibility

- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus indicators
- ARIA labels on all interactive elements

