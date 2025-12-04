/**
 * DataGrid component using TanStack Table.
 * Inspired by ag-grid community edition.
 */
import React, { useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from '@tanstack/react-table'

export interface DataGridColumn<T> {
  id?: string
  header?: string | ((props: any) => React.ReactNode)
  headerName?: string
  field?: string
  accessorKey?: string
  accessorFn?: (row: T) => any
  cell?: (props: any) => React.ReactNode
  sortable?: boolean
  filterable?: boolean
  resizable?: boolean
  width?: number | string
  minWidth?: number
  maxWidth?: number
  pinned?: 'left' | 'right'
  cellRenderer?: (params: { value: any; row: T; column: DataGridColumn<T> }) => React.ReactNode
  enableSorting?: boolean
  enableColumnFilter?: boolean
  size?: number
}

export interface DataGridProps<T> {
  /** Data rows */
  data: T[]
  /** Column definitions */
  columns: DataGridColumn<T>[]
  /** Enable sorting */
  enableSorting?: boolean
  /** Enable filtering */
  enableFiltering?: boolean
  /** Show filters by default */
  showFiltersByDefault?: boolean
  /** Enable pagination */
  enablePagination?: boolean
  /** Page size for pagination */
  pageSize?: number
  /** Initial sorting state */
  defaultSorting?: SortingState
  /** Initial column filters */
  defaultColumnFilters?: ColumnFiltersState
  /** Initial column visibility */
  defaultColumnVisibility?: VisibilityState
  /** Row selection mode */
  rowSelection?: 'single' | 'multiple' | false
  /** Callback when row is selected */
  onRowSelectionChange?: (selectedRows: T[]) => void
  /** Show row numbers */
  showRowNumbers?: boolean
  /** Custom row class name */
  getRowClassName?: (row: T) => string
  /** Loading state */
  loading?: boolean
  /** Empty state message */
  emptyMessage?: string
  /** Height of the grid */
  height?: string | number
  /** Compact mode */
  compact?: boolean
  /** Custom className */
  className?: string
}

export function DataGrid<T extends Record<string, any>>({
  data,
  columns,
  enableSorting = true,
  enableFiltering = true,
  showFiltersByDefault = false,
  enablePagination = true,
  pageSize = 10,
  defaultSorting = [],
  defaultColumnFilters = [],
  defaultColumnVisibility = {},
  rowSelection = false,
  onRowSelectionChange,
  showRowNumbers = false,
  getRowClassName,
  loading = false,
  emptyMessage = 'No data available',
  height,
  compact = false,
  className = '',
}: DataGridProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>(defaultSorting)
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(defaultColumnFilters)
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(defaultColumnVisibility)
  const [rowSelectionState, setRowSelectionState] = React.useState<Record<string, boolean>>({})
  const [showFilters, setShowFilters] = React.useState<boolean>(showFiltersByDefault)

  // Transform columns to TanStack Table format
  const tableColumns = useMemo(() => {
    const transformedColumns: ColumnDef<T>[] = []

    // Add row number column if enabled
    if (showRowNumbers) {
      transformedColumns.push({
        id: '__rowNumber',
        header: '#',
        cell: ({ row }) => row.index + 1,
        size: 60,
        enableSorting: false,
        enableColumnFilter: false,
      })
    }

    // Transform data grid columns
    columns.forEach((col) => {
      const baseColumnDef: Partial<ColumnDef<T>> = {
        id: col.id || col.field || col.accessorKey,
        header: col.headerName || col.header || col.id || col.field,
        enableSorting: (col.sortable !== false && col.enableSorting !== false) && enableSorting,
        enableColumnFilter: (col.filterable !== false && col.enableColumnFilter !== false) && enableFiltering,
        size: col.width ? (typeof col.width === 'number' ? col.width : col.size) : col.size,
        minSize: col.minWidth,
        maxSize: col.maxWidth,
        cell: col.cellRenderer
          ? ({ getValue, row }) => col.cellRenderer!({ value: getValue(), row: row.original, column: col })
          : col.cell,
      }
      
      // Build the column definition with the appropriate accessor
      let columnDef: ColumnDef<T>
      if (col.accessorFn) {
        columnDef = {
          ...baseColumnDef,
          accessorFn: col.accessorFn,
        } as ColumnDef<T>
      } else {
        const accessorKey = col.field || col.accessorKey
        if (accessorKey) {
          columnDef = {
            ...baseColumnDef,
            accessorKey: accessorKey,
          } as ColumnDef<T>
        } else {
          // Fallback: use id as accessorKey if nothing else is provided
          columnDef = {
            ...baseColumnDef,
            accessorKey: col.id || 'unknown',
          } as ColumnDef<T>
        }
      }
      
      transformedColumns.push(columnDef)
    })

    return transformedColumns
  }, [columns, enableSorting, enableFiltering, showRowNumbers])

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection: rowSelectionState,
    },
    enableRowSelection: rowSelection !== false,
    onRowSelectionChange: setRowSelectionState,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    manualPagination: !enablePagination,
    initialState: {
      pagination: {
        pageSize,
      },
    },
  })

  // Handle row selection changes
  React.useEffect(() => {
    if (onRowSelectionChange && rowSelection !== false) {
      const selectedRows = table.getFilteredSelectedRowModel().rows.map((row) => row.original)
      onRowSelectionChange(selectedRows)
    }
  }, [rowSelectionState, table, onRowSelectionChange, rowSelection])

  const gridStyle: React.CSSProperties = {
    height: height ? (typeof height === 'number' ? `${height}px` : height) : 'auto',
    display: 'flex',
    flexDirection: 'column',
  }

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
  }

  return (
    <div className={`data-grid ${className}`} style={gridStyle}>
      {/* Filter Toggle Button */}
      {enableFiltering && (
        <div className="data-grid-filter-toggle p-2 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border-default)' }}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 py-1 text-sm border rounded transition-colors"
            style={{
              borderColor: 'var(--color-border-default)',
              color: 'var(--color-text-secondary)',
              backgroundColor: showFilters ? 'var(--color-primary-500)' : 'transparent',
            }}
            onMouseEnter={(e) => {
              if (!showFilters) {
                e.currentTarget.style.backgroundColor = 'var(--color-border-light)'
              }
            }}
            onMouseLeave={(e) => {
              if (!showFilters) {
                e.currentTarget.style.backgroundColor = 'transparent'
              }
            }}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          {showFilters && columnFilters.length > 0 && (
            <button
              onClick={() => {
                setColumnFilters([])
                table.resetColumnFilters()
              }}
              className="px-3 py-1 text-sm border rounded transition-colors"
              style={{
                borderColor: 'var(--color-border-default)',
                color: 'var(--color-text-secondary)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-border-light)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Column Filters */}
      {enableFiltering && showFilters && (
        <div className="data-grid-filters p-2 border-b" style={{ borderColor: 'var(--color-border-default)' }}>
          {table.getHeaderGroups().map((headerGroup) =>
            headerGroup.headers.map((header) => {
              if (!header.column.getCanFilter()) return null
              return (
                <div key={header.id} className="inline-block mr-4 mb-2">
                  <input
                    type="text"
                    placeholder={`Filter ${header.column.id}...`}
                    value={(header.column.getFilterValue() as string) ?? ''}
                    onChange={(e) => header.column.setFilterValue(e.target.value)}
                    className="px-2 py-1 text-sm border rounded"
                    style={{ borderColor: 'var(--color-border-default)' }}
                  />
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Table Container */}
      <div className="data-grid-container flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--color-primary-500)' }}></div>
              <p className="mt-4" style={{ color: 'var(--color-text-secondary)' }}>
                Loading...
              </p>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p style={{ color: 'var(--color-text-secondary)' }}>{emptyMessage}</p>
          </div>
        ) : (
          <table style={tableStyle}>
            <thead style={{ backgroundColor: 'var(--color-border-light)', position: 'sticky', top: 0, zIndex: 10 }}>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        compact ? 'px-2 py-1 text-xs' : ''
                      }`}
                      style={{
                        color: 'var(--color-text-secondary)',
                        width: header.getSize() !== 150 ? header.getSize() : undefined,
                        minWidth: header.column.columnDef.minSize,
                        maxWidth: header.column.columnDef.maxSize,
                        cursor: header.column.getCanSort() ? 'pointer' : 'default',
                      }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-2">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span className="text-xs">
                            {{
                              asc: '↑',
                              desc: '↓',
                            }[header.column.getIsSorted() as string] ?? '⇅'}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-border-default)' }}>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`hover:bg-gray-50 ${
                    rowSelection !== false && row.getIsSelected() ? 'bg-blue-50' : ''
                  } ${getRowClassName ? getRowClassName(row.original) : ''}`}
                  onClick={() => {
                    if (rowSelection === 'single') {
                      setRowSelectionState({ [row.id]: !row.getIsSelected() })
                    } else if (rowSelection === 'multiple') {
                      row.toggleSelected()
                    }
                  }}
                  style={{ cursor: rowSelection !== false ? 'pointer' : 'default' }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={`px-4 py-3 whitespace-nowrap ${compact ? 'px-2 py-1 text-sm' : ''}`}
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {enablePagination && (
        <div className="data-grid-pagination p-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--color-border-default)' }}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="px-3 py-1 border rounded disabled:opacity-50"
              style={{ borderColor: 'var(--color-border-default)' }}
            >
              {'<<'}
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-3 py-1 border rounded disabled:opacity-50"
              style={{ borderColor: 'var(--color-border-default)' }}
            >
              {'<'}
            </button>
            <span className="px-4" style={{ color: 'var(--color-text-secondary)' }}>
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-3 py-1 border rounded disabled:opacity-50"
              style={{ borderColor: 'var(--color-border-default)' }}
            >
              {'>'}
            </button>
            <button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="px-3 py-1 border rounded disabled:opacity-50"
              style={{ borderColor: 'var(--color-border-default)' }}
            >
              {'>>'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ color: 'var(--color-text-secondary)' }}>Rows per page:</span>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="px-2 py-1 border rounded"
              style={{ borderColor: 'var(--color-border-default)' }}
            >
              {[10, 20, 30, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <div style={{ color: 'var(--color-text-secondary)' }}>
            Showing {table.getRowModel().rows.length} of {data.length} rows
          </div>
        </div>
      )}
    </div>
  )
}

