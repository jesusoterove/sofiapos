# Console Layout Specification

## Main Application Layout

### Header Component
**Location**: Top of the application
**Purpose**: Display app branding, store context, user information, and global actions

**Elements**:
- **Left Section**:
  - Application logo/name
  - Current store selector (dropdown)
- **Center Section**:
  - Search bar (global search across entities)
- **Right Section**:
  - Notifications icon with badge
  - User menu dropdown:
    - User name and avatar
    - Profile link
    - Settings link
    - Logout button
  - Language selector

**Behavior**:
- Fixed position at top
- Sticky on scroll
- Responsive: collapses on mobile

### Sidebar Component
**Location**: Left side of the application
**Purpose**: Main navigation menu

**Structure**:
- Collapsible sections:
  - **Dashboard**
  - **Operations**
    - Stores
    - Users
    - Roles & Permissions
  - **Products**
    - Products
    - Materials
    - Recipes
    - Categories
    - Tags
  - **Inventory**
    - Inventory Entries
    - Stock Levels
  - **Sales**
    - Orders
    - Payments
    - Cash Registers
    - Shifts
  - **Configuration**
    - Vendors
    - Customers
    - Taxes
    - Discounts
    - Payment Methods
    - Tables
    - Unit of Measures
  - **Reports**
  - **Settings**

**Behavior**:
- Collapsible/expandable sections
- Active route highlighting
- Icon + text labels
- Responsive: collapses to icon-only on mobile
- Can be completely hidden on mobile (hamburger menu)

### Main Content Area
**Location**: Center/right of the application
**Purpose**: Display page content

**Structure**:
- Page header (breadcrumbs, title, action buttons)
- Content area (scrollable)
- Page footer (pagination, additional actions)

## Page Layout Patterns

### List Page Pattern

```
┌─────────────────────────────────────────────────────────┐
│  Page Title                    [New Button] [Export]   │
├─────────────────────────────────────────────────────────┤
│  [Search] [Filters ▼] [Sort ▼]                         │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Data Table                                         │ │
│  │  ┌─────┬─────────┬─────────┬─────────┬──────────┐ │ │
│  │  │ ☐  │ Column1 │ Column2 │ Column3 │ Actions  │ │ │
│  │  ├─────┼─────────┼─────────┼─────────┼──────────┤ │ │
│  │  │ ☐  │ Data    │ Data    │ Data    │ [Edit]   │ │ │
│  │  │ ☐  │ Data    │ Data    │ Data    │ [Delete] │ │ │
│  │  └─────┴─────────┴─────────┴─────────┴──────────┘ │ │
│  └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│  [Bulk Actions]                    [1] [2] [3] ... [>] │
└─────────────────────────────────────────────────────────┘
```

### Form Page Pattern

```
┌─────────────────────────────────────────────────────────┐
│  Page Title                    [Cancel] [Save] [Save &...]│
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Form Card                                          │ │
│  │  ┌───────────────────────────────────────────────┐  │ │
│  │  │ Section Title                                │  │ │
│  │  │ ──────────────────────────────────────────── │  │ │
│  │  │ Label: [Input Field              ]          │  │ │
│  │  │ Label: [Select Dropdown          ▼]        │  │ │
│  │  │ Label: [Checkbox] ☑                        │  │ │
│  │  └───────────────────────────────────────────────┘  │ │
│  │  ┌───────────────────────────────────────────────┐  │ │
│  │  │ Section Title                                │  │ │
│  │  │ ──────────────────────────────────────────── │  │ │
│  │  │ ...                                          │  │ │
│  │  └───────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Detail Page Pattern

```
┌─────────────────────────────────────────────────────────┐
│  Page Title                    [Edit] [Delete] [Actions] │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Tabs: [Overview] [Details] [History] [Related]   │ │
│  ├─────────────────────────────────────────────────────┤ │
│  │  ┌───────────────────────────────────────────────┐  │ │
│  │  │ Information Card                             │  │ │
│  │  │ ────────────────────────────────────────────  │  │ │
│  │  │ Field: Value                                │  │ │
│  │  │ Field: Value                                │  │ │
│  │  └───────────────────────────────────────────────┘  │ │
│  │  ┌───────────────────────────────────────────────┐  │ │
│  │  │ Related Data Table                           │  │ │
│  │  │ ...                                          │  │ │
│  │  └───────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Dashboard Pattern

```
┌─────────────────────────────────────────────────────────┐
│  Dashboard                                               │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ Stat 1   │ │ Stat 2   │ │ Stat 3   │ │ Stat 4   │  │
│  │ ──────── │ │ ──────── │ │ ──────── │ │ ──────── │  │
│  │ Value    │ │ Value    │ │ Value    │ │ Value    │  │
│  │ Trend ↑  │ │ Trend ↓  │ │ Trend →  │ │ Trend ↑  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐ ┌──────────────────────┐    │
│  │ Sales Chart          │ │ Recent Orders        │    │
│  │ ────────────────────  │ │ ────────────────────  │    │
│  │ [Chart Area]         │ │ [Order List]         │    │
│  │                      │ │                      │    │
│  └──────────────────────┘ └──────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Component Specifications

### Data Table Component

**Features**:
- Column sorting (click header)
- Column filtering (filter icon in header)
- Row selection (checkbox)
- Bulk actions (when rows selected)
- Pagination
- Page size selector
- Export functionality
- Responsive: horizontal scroll on mobile

**Actions Column**:
- View (eye icon)
- Edit (pencil icon)
- Delete (trash icon)
- More actions (three dots menu)

### Form Component

**Features**:
- Field validation (real-time)
- Error messages below fields
- Required field indicators (*)
- Section grouping
- Save/Cancel buttons
- Save & Continue button (for create forms)
- Auto-save draft (optional)

**Field Types**:
- Text input
- Number input
- Email input
- Password input
- Textarea
- Select dropdown
- Multi-select
- Checkbox
- Radio buttons
- Date picker
- File upload
- Image upload with preview

### Modal Component

**Features**:
- Overlay backdrop
- Centered positioning
- Close button (X)
- Escape key to close
- Focus trap
- Scrollable content
- Footer with action buttons
- Sizes: small, medium, large, full-screen

### Search Bar Component

**Features**:
- Debounced input (300ms)
- Clear button (X)
- Search icon
- Placeholder text
- Keyboard shortcut (Ctrl/Cmd + K)

### Filter Bar Component

**Features**:
- Multiple filter types:
  - Text filter
  - Select filter
  - Date range filter
  - Number range filter
  - Boolean filter
- Active filter badges
- Clear all filters button
- Save filter presets

## Responsive Breakpoints

- **Mobile**: < 768px
  - Sidebar: Hidden (hamburger menu)
  - Tables: Horizontal scroll or card view
  - Forms: Single column
  - Modals: Full screen

- **Tablet**: 768px - 1024px
  - Sidebar: Collapsible (icon-only when collapsed)
  - Tables: Horizontal scroll
  - Forms: Two columns where appropriate
  - Modals: Medium size

- **Desktop**: > 1024px
  - Sidebar: Full width
  - Tables: Full columns visible
  - Forms: Multi-column layouts
  - Modals: Centered with max-width

## Color Scheme

- **Primary**: Blue (#3B82F6)
- **Secondary**: Gray (#6B7280)
- **Success**: Green (#10B981)
- **Warning**: Yellow (#F59E0B)
- **Danger**: Red (#EF4444)
- **Info**: Cyan (#06B6D4)

## Typography

- **Heading 1**: 2rem (32px), bold
- **Heading 2**: 1.5rem (24px), bold
- **Heading 3**: 1.25rem (20px), semibold
- **Body**: 1rem (16px), regular
- **Small**: 0.875rem (14px), regular
- **Caption**: 0.75rem (12px), regular

## Spacing

- Consistent spacing scale: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px
- Card padding: 24px
- Form field spacing: 16px vertical
- Section spacing: 32px vertical

## Animation & Transitions

- Page transitions: 200ms ease-in-out
- Modal open/close: 300ms ease-in-out
- Hover effects: 150ms ease-in-out
- Loading states: Skeleton screens or spinners

