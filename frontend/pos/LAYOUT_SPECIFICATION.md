# POS Layout Specification

## Main POS Screen Layout

### Overall Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                         TOP BAR (Fixed)                         │
│  Height: 60px                                                   │
├──────────────────────────┬──────────────────────────────────────┤
│                          │                                      │
│  PRODUCT SELECTION       │         ORDER DETAILS PANEL          │
│  PANEL                   │         (Fixed Width: 400px)          │
│  (Flexible Width)        │                                      │
│                          │                                      │
│                          │                                      │
│                          │                                      │
│                          │                                      │
│                          │                                      │
│                          │                                      │
│                          │                                      │
│                          │                                      │
├──────────────────────────┴──────────────────────────────────────┤
│                         BOTTOM BAR (Fixed)                       │
│  Height: 50px                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Top Bar Specification

### Dimensions
- **Height**: 60px (fixed)
- **Background**: Dark theme (#1F2937)
- **Text Color**: Light (#F9FAFB)
- **Padding**: 16px horizontal, 12px vertical

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ [Logo] App Name v1.0 │ Username │ 14:30:25 │ [Logout] [Shift] [Inv]│
└─────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

#### App Details Section (Left)
- **Width**: Auto (flexible)
- **Content**:
  - Logo image (32x32px) or app name
  - Version number (small text)
- **Alignment**: Left

#### User Details Section (Center-Left)
- **Width**: Auto (flexible)
- **Content**:
  - "Username: " label
  - Username value
- **Alignment**: Left

#### Current Time Section (Center)
- **Width**: Auto (flexible)
- **Content**:
  - Live clock (HH:MM:SS format)
  - Updates every second
- **Alignment**: Center

#### Action Buttons Section (Right)
- **Width**: Auto (flexible)
- **Buttons**:
  1. **Logout**: Opens confirmation modal
  2. **Close Shift**: Opens shift close modal
  3. **Inventory Entry**: Navigates to inventory screen
- **Button Size**: 100px width, 36px height
- **Spacing**: 8px between buttons
- **Alignment**: Right

## Product Selection Panel Specification

### Dimensions
- **Width**: Flexible (remaining space after order panel)
- **Height**: Flexible (viewport height - top bar - bottom bar)
- **Padding**: 16px
- **Background**: Light (#FFFFFF)

### Layout Structure

```
┌─────────────────────────────────────┐
│ [Scan] [Search Bar              ]  │  Height: 48px
├─────────────────────────────────────┤
│ [Cat1] [Cat2] [Cat3] [Cat4] ...   │  Height: 48px
├─────────────────────────────────────┤
│                                     │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐         │
│  │P1 │ │P2 │ │P3 │ │P4 │         │
│  └───┘ └───┘ └───┘ └───┘         │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐         │
│  │P5 │ │P6 │ │P7 │ │P8 │         │
│  └───┘ └───┘ └───┘ └───┘         │
│  ... (scrollable)                 │
│                                     │
└─────────────────────────────────────┘
```

### Scan Button
- **Size**: 48x48px
- **Position**: Left of search bar
- **Icon**: Barcode scanner icon
- **Behavior**: Opens barcode scanner or input modal

### Search Bar
- **Height**: 48px
- **Width**: Remaining space after scan button
- **Padding**: 12px horizontal
- **Placeholder**: "Search products..."
- **Icon**: Search icon on left
- **Clear Button**: X icon on right (when text entered)
- **Debounce**: 300ms

### Category Tabs
- **Height**: 48px
- **Layout**: Horizontal scrollable
- **Tab Size**: Auto width, minimum 80px
- **Padding**: 12px horizontal per tab
- **Active Indicator**: Bottom border, 3px, primary color
- **Scroll Behavior**: Smooth horizontal scroll
- **Spacing**: 4px between tabs

### Product Grid
- **Layout**: CSS Grid
- **Columns**: 
  - Desktop: 4-5 columns
  - Tablet: 3 columns
  - Mobile: 2 columns
- **Gap**: 12px
- **Scroll**: Vertical scroll
- **Padding**: 16px

### Product Tile Specification

#### Grid View Tile
- **Size**: 120x120px minimum
- **Padding**: 8px
- **Border**: 1px solid #E5E7EB
- **Border Radius**: 8px
- **Background**: White
- **Hover Effect**: Shadow elevation, scale 1.02

**Content Layout**:
```
┌─────────────────┐
│   [Image]       │ 60x60px
│                 │
│ Product Name    │ 2 lines max, truncate
│ $XX.XX          │ Bold, primary color
│ Stock: XX       │ Small, gray (if applicable)
└─────────────────┘
```

#### List View Tile
- **Height**: 80px
- **Width**: Full width
- **Layout**: Horizontal flex
- **Padding**: 12px

**Content Layout**:
```
┌─────────────────────────────────────────────┐
│ [Image] │ Product Name │ $XX.XX │ [+ Add] │
│ 60x60px │ Description  │ Stock  │         │
└─────────────────────────────────────────────┘
```

## Order Details Panel Specification

### Dimensions
- **Width**: 400px (fixed)
- **Height**: Flexible (viewport height - top bar - bottom bar)
- **Background**: Light gray (#F9FAFB)
- **Border**: Left border, 1px solid #E5E7EB
- **Padding**: 16px

### Layout Structure

```
┌─────────────────────────────────────┐
│ Customer: [Name] [Lookup] [New]    │  Height: 48px
├─────────────────────────────────────┤
│ Order Items (Scrollable)            │  Flexible height
│ ┌───────────────────────────────┐  │
│ │ Item 1                        │  │
│ │ Description                   │  │
│ │ [-] 2 [+]  $10.00  $20.00 [X] │  │
│ └───────────────────────────────┘  │
│ ┌───────────────────────────────┐  │
│ │ Item 2                        │  │
│ │ ...                            │  │
│ └───────────────────────────────┘  │
├─────────────────────────────────────┤
│ Subtotal: $XX.XX                   │  Height: Auto
│ Taxes:    $XX.XX                   │
│ Discount: $XX.XX                   │
│ ─────────────────────────────────  │
│ Total:    $XX.XX                   │  Bold, larger font
├─────────────────────────────────────┤
│ [Save Draft] [Pay] [Cancel]        │  Height: 60px
└─────────────────────────────────────┘
```

### Customer Selector Bar
- **Height**: 48px
- **Layout**: Horizontal flex
- **Padding**: 8px
- **Background**: White
- **Border**: Bottom border, 1px solid #E5E7EB

**Elements**:
- Customer name display (flexible width)
- Lookup button (80px width)
- New button (80px width)

### Order Items List
- **Height**: Flexible (scrollable)
- **Padding**: 8px vertical
- **Spacing**: 8px between items
- **Scroll**: Vertical scroll when overflow

### Order Item Component
- **Height**: Auto (minimum 80px)
- **Padding**: 12px
- **Background**: White
- **Border Radius**: 8px
- **Margin**: 8px bottom

**Layout**:
```
┌─────────────────────────────────────────────┐
│ Product Name                    $XX.XX     │
│ Description                                 │
│ [-] Qty [+]  Unit: $XX.XX  Total: $XX.XX [X]│
└─────────────────────────────────────────────┘
```

**Quantity Controls**:
- Decrease button: 32x32px, "-" icon
- Quantity display: 40px width, editable on click
- Increase button: 32x32px, "+" icon
- Remove button: 32x32px, "X" icon, right aligned

### Order Totals Section
- **Padding**: 16px
- **Background**: White
- **Border**: Top border, 2px solid #E5E7EB

**Layout**:
```
Subtotal:        $XX.XX
Taxes:           $XX.XX
Discount:        $XX.XX
────────────────────────
Total:           $XX.XX  (Bold, 20px)
```

### Action Buttons Bar
- **Height**: 60px
- **Layout**: Horizontal flex, space between
- **Padding**: 12px
- **Background**: White
- **Border**: Top border, 1px solid #E5E7EB

**Buttons**:
- **Save Draft**: Secondary style, 120px width
- **Pay**: Primary style, 150px width, prominent
- **Cancel**: Danger style, 100px width

## Bottom Bar Specification

### Dimensions
- **Height**: 50px (fixed)
- **Background**: Dark theme (#1F2937)
- **Text Color**: Light (#F9FAFB)
- **Padding**: 12px horizontal

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ Shift: Open │ Cash: Open │ Sync: Online (3) │ [Settings]        │
└─────────────────────────────────────────────────────────────────┘
```

### Status Indicators
- **Shift Status**: Shows "Open" or "Closed", color-coded
- **Cash Register Status**: Shows "Open" or "Closed", color-coded
- **Sync Status**: 
  - "Online" (green) or "Offline" (red)
  - Pending sync count in parentheses
  - Click to open sync queue

### Settings Button
- **Position**: Right aligned
- **Size**: 36x36px
- **Icon**: Gear icon

## Payment Screen Specification

### Dimensions
- **Width**: 600px (centered modal)
- **Height**: Auto (max 800px)
- **Background**: White
- **Border Radius**: 12px
- **Padding**: 24px

### Layout Structure

```
┌─────────────────────────────────────────┐
│ Payment                                │
├─────────────────────────────────────────┤
│ Order Total: $XX.XX                    │  Large, bold, 32px
├─────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐    │
│ │ Payment      │ │ Amount Paid  │    │
│ │ Method       │ │              │    │
│ │              │ │              │    │
│ │ ○ Cash       │ │ $ [20.00]    │    │
│ │ ○ Transfer   │ │              │    │
│ └──────────────┘ └──────────────┘    │
├─────────────────────────────────────────┤
│ Change: $XX.XX                         │  Large, bold, 24px
├─────────────────────────────────────────┤
│ Payment Summary                        │
│ ────────────────────────────────────── │
│ Subtotal: $XX.XX                       │
│ Taxes:    $XX.XX                       │
│ Total:    $XX.XX                       │
│ Paid:     $XX.XX                       │
│ Change:   $XX.XX                       │
├─────────────────────────────────────────┤
│ [Cancel]        [Process Payment]      │
└─────────────────────────────────────────┘
```

### Payment Method Selection
- **Layout**: Radio buttons, vertical stack
- **Options**: Cash, Bank Transfer only
- **Size**: Full width buttons, 48px height
- **Spacing**: 8px between options

### Amount Paid Input
- **Height**: 60px
- **Font Size**: 24px
- **Alignment**: Right
- **Prefix**: "$" symbol
- **Input Type**: Numeric
- **Keypad**: Opens numeric keypad modal

### Change Display
- **Font Size**: 24px
- **Font Weight**: Bold
- **Color**: Green (if positive), Red (if negative)
- **Alignment**: Center

### Payment Summary
- **Layout**: Vertical list
- **Font Size**: 16px
- **Spacing**: 8px between lines
- **Total Line**: Bold, larger font

### Action Buttons
- **Cancel**: Secondary style, left aligned
- **Process Payment**: Primary style, right aligned, prominent
- **Height**: 48px
- **Width**: 150px each

## Tables Screen Specification

### Dimensions
- **Full Screen**: Viewport width and height
- **Padding**: 24px
- **Background**: Light gray (#F9FAFB)

### Grid Layout
- **Columns**: Responsive
  - Desktop: 5-6 columns
  - Tablet: 4 columns
  - Mobile: 2 columns
- **Gap**: 16px
- **Scroll**: Vertical scroll when overflow

### Table Tile Specification
- **Size**: 
  - Desktop: 150x150px
  - Tablet: 140x140px
  - Mobile: 120x120px
- **Padding**: 12px
- **Border**: 2px solid
- **Border Radius**: 12px
- **Background**: White

**Content Layout**:
```
┌─────────────────┐
│ Table #X        │  Bold, 18px
│ Table Name      │  14px
│                 │
│ Status Badge    │  Color-coded
│ Order Status    │  Small text
│                 │
│ Capacity: X     │  12px
│ Location: X     │  12px
└─────────────────┘
```

**Status Colors**:
- **Open**: Green border (#10B981)
- **Closed**: Gray border (#6B7280)
- **Has Order**: Blue border (#3B82F6)

## Color Scheme

- **Primary**: Blue (#3B82F6)
- **Secondary**: Gray (#6B7280)
- **Success**: Green (#10B981)
- **Warning**: Yellow (#F59E0B)
- **Danger**: Red (#EF4444)
- **Background Light**: White (#FFFFFF)
- **Background Dark**: Dark gray (#1F2937)
- **Border**: Light gray (#E5E7EB)
- **Text Primary**: Dark (#111827)
- **Text Secondary**: Gray (#6B7280)
- **Text Light**: Light (#F9FAFB)

## Typography

- **Heading 1**: 2rem (32px), bold
- **Heading 2**: 1.5rem (24px), bold
- **Heading 3**: 1.25rem (20px), semibold
- **Body**: 1rem (16px), regular
- **Small**: 0.875rem (14px), regular
- **Caption**: 0.75rem (12px), regular
- **Price**: 1.125rem (18px), bold, primary color

## Spacing

- Consistent spacing scale: 4px, 8px, 12px, 16px, 24px, 32px
- Card padding: 12px
- Section spacing: 16px vertical
- Button spacing: 8px between buttons
- Touch target minimum: 44px (iOS) / 48px (Android)

## Animation & Transitions

- **Page transitions**: 200ms ease-in-out
- **Modal open/close**: 300ms ease-in-out
- **Button hover**: 150ms ease-in-out
- **Product tile hover**: Scale 1.02, shadow elevation
- **Loading states**: Skeleton screens or spinners
- **Toast notifications**: Slide in from top, 300ms

## Touch Interactions

- **Tap**: Primary action
- **Long press**: Secondary action (context menu)
- **Swipe**: Quick actions (remove item, etc.)
- **Pinch/Zoom**: Disabled (except for images)
- **Haptic feedback**: On button presses (if available)

## Keyboard Shortcuts

- **F1**: Open help
- **F2**: Open search
- **F3**: Focus order panel
- **F4**: Process payment
- **F5**: Save draft
- **Esc**: Cancel/Close modal
- **Ctrl/Cmd + S**: Save draft
- **Ctrl/Cmd + P**: Process payment
- **Ctrl/Cmd + K**: Open search

