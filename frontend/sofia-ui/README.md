# SofiaPOS UI Component Library

A shared UI component library for SofiaPOS Console and POS applications.

## Installation

```bash
npm install @sofiapos/ui
```

## Usage

### Setup Theme Provider

```tsx
import { ThemeProvider } from '@sofiapos/ui'
import '@sofiapos/ui/styles'

function App() {
  return (
    <ThemeProvider>
      {/* Your app content */}
    </ThemeProvider>
  )
}
```

### Using Components

```tsx
import { Button, DataGrid, ThemeSwitcher } from '@sofiapos/ui'

function MyComponent() {
  return (
    <div>
      <Button variant="primary">Click me</Button>
      <ThemeSwitcher />
      <DataGrid data={myData} columns={myColumns} />
    </div>
  )
}
```

## Components

### Button

A versatile button component with multiple variants.

```tsx
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="danger">Danger</Button>
```

### DataGrid

A powerful data grid component built on TanStack Table, inspired by ag-grid.

Features:
- Sorting
- Filtering
- Pagination
- Row selection
- Column resizing
- Custom cell renderers

```tsx
<DataGrid
  data={data}
  columns={columns}
  enableSorting
  enableFiltering
  enablePagination
  pageSize={10}
/>
```

### ThemeSwitcher

A dropdown component for switching between available themes.

```tsx
<ThemeSwitcher />
```

## Development

```bash
# Install dependencies
npm install

# Build library
npm run build

# Watch mode
npm run dev
```

