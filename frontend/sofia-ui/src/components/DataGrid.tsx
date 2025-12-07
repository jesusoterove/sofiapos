/**
 * DataGrid component using TanStack Table.
 * Inspired by ag-grid community edition.
 */
import React, { useMemo, useContext } from 'react'
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
import {
  TextCellRenderer,
  NumberCellRenderer,
  YesNoCellRenderer,
  DateCellRenderer,
  DateTimeCellRenderer,
  TimeCellRenderer,
  CheckboxCellRenderer,
} from './cells'
import { DataGridPagination } from './DataGridPagination'
import { useTranslation } from '../i18n/hooks'
import { SettingsContext } from '../contexts/SettingsContext'

export type CellRendererType = 'string' | 'number' | 'money' | 'date' | 'datetime' | 'time' | 'checkbox' | 'yesno'

export interface CellRendererOptions {
  align?: 'left' | 'center' | 'right'
  decPlaces?: number // For NumberCellRenderer and money type
  dateFormat?: 'short' | 'medium' | 'long' | 'full' | string // For DateCellRenderer
  dateTimeFormat?: 'short' | 'medium' | 'long' | 'full' | string // For DateTimeCellRenderer
  timeFormat?: 'short' | 'medium' | 'long' | string // For TimeCellRenderer
  prefix?: string // For NumberCellRenderer (e.g., currency symbol)
  suffix?: string // For NumberCellRenderer
  formatAsMoney?: boolean // For NumberCellRenderer - format as currency
  currency?: string // For NumberCellRenderer and money type - currency code (e.g., 'USD', 'EUR')
  locale?: string // For NumberCellRenderer and money type - locale for formatting (e.g., 'en-US', 'es-ES')
  disabled?: boolean // For CheckboxCellRenderer
  onChange?: (checked: boolean) => void // For CheckboxCellRenderer
}

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
  type?: CellRendererType
  cellRendererOptions?: CellRendererOptions
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
  enableFiltering = false,
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
  emptyMessage,
  height,
  compact = false,
  className = '',
}: DataGridProps<T>) {
  const { t } = useTranslation()
  const settingsContext = useContext(SettingsContext)
  const defaultMoneyDecimalPlaces = settingsContext?.moneyDecimalPlaces ?? 2
  
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
      // Determine default cell renderer based on type property or value type if not provided
      let defaultCellRenderer: ((params: { value: any; row: T; column: DataGridColumn<T> }) => React.ReactNode) | undefined
      const options = col.cellRendererOptions || {}
      
      if (!col.cellRenderer && !col.cell) {
        // If type is explicitly provided, use it
        if (col.type) {
          switch (col.type) {
            case 'string':
              defaultCellRenderer = ({ value }) => <TextCellRenderer value={value} align={options.align} />
              break
            case 'number':
              defaultCellRenderer = ({ value }) => (
                <NumberCellRenderer 
                  value={value} 
                  align={options.align}
                  decPlaces={options.decPlaces}
                  prefix={options.prefix}
                  suffix={options.suffix}
                  formatAsMoney={options.formatAsMoney}
                  currency={options.currency}
                  locale={options.locale}
                />
              )
              break
            case 'money':
              defaultCellRenderer = ({ value }) => (
                <NumberCellRenderer 
                  value={value} 
                  align={options.align || 'right'}
                  decPlaces={options.decPlaces !== undefined ? options.decPlaces : defaultMoneyDecimalPlaces}
                  formatAsMoney={true}
                  currency={options.currency || 'USD'}
                  locale={options.locale || 'en-US'}
                />
              )
              break
            case 'date':
              defaultCellRenderer = ({ value }) => (
                <DateCellRenderer 
                  value={value} 
                  format={options.dateFormat}
                  align={options.align}
                />
              )
              break
            case 'datetime':
              defaultCellRenderer = ({ value }) => (
                <DateTimeCellRenderer 
                  value={value} 
                  format={options.dateTimeFormat}
                  align={options.align}
                />
              )
              break
            case 'time':
              defaultCellRenderer = ({ value }) => (
                <TimeCellRenderer 
                  value={value} 
                  format={options.timeFormat}
                  align={options.align}
                />
              )
              break
            case 'checkbox':
              defaultCellRenderer = ({ value }) => (
                <CheckboxCellRenderer 
                  value={value} 
                  align={options.align}
                  disabled={options.disabled}
                  onChange={options.onChange}
                />
              )
              break
            case 'yesno':
              defaultCellRenderer = ({ value }) => (
                <YesNoCellRenderer 
                  value={value} 
                  align={options.align}
                />
              )
              break
          }
        } else {
          // Try to infer cell renderer from first data row
          if (data.length > 0) {
            const sampleValue = col.accessorFn 
              ? col.accessorFn(data[0])
              : col.field 
              ? (data[0] as any)[col.field]
              : col.accessorKey
              ? (data[0] as any)[col.accessorKey]
              : undefined
            
            if (sampleValue !== undefined && sampleValue !== null) {
              if (typeof sampleValue === 'boolean') {
                defaultCellRenderer = ({ value }) => <YesNoCellRenderer value={value} align={options.align} />
              } else if (typeof sampleValue === 'number') {
                defaultCellRenderer = ({ value }) => (
                  <NumberCellRenderer 
                    value={value} 
                    align={options.align}
                    decPlaces={options.decPlaces}
                    prefix={options.prefix}
                    suffix={options.suffix}
                  />
                )
              } else if (sampleValue instanceof Date || (typeof sampleValue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(sampleValue))) {
                // Check if it's a date string or Date object
                const dateStr = sampleValue instanceof Date ? sampleValue.toISOString() : sampleValue
                // Check if it includes time (has T or space with time)
                if (dateStr.includes('T') || /\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(dateStr)) {
                  defaultCellRenderer = ({ value }) => (
                    <DateTimeCellRenderer 
                      value={value} 
                      format={options.dateTimeFormat}
                      align={options.align}
                    />
                  )
                } else {
                  defaultCellRenderer = ({ value }) => (
                    <DateCellRenderer 
                      value={value} 
                      format={options.dateFormat}
                      align={options.align}
                    />
                  )
                }
              } else if (typeof sampleValue === 'string') {
                defaultCellRenderer = ({ value }) => <TextCellRenderer value={value} align={options.align} />
              }
            }
          }
        }
      }
      
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
          : defaultCellRenderer
          ? ({ getValue, row }) => defaultCellRenderer!({ value: getValue(), row: row.original, column: col })
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
  }, [columns, enableSorting, enableFiltering, showRowNumbers, data])

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
    border: '1px solid var(--color-border-default)',
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
            {showFilters ? t('dataGrid.hideFilters') : t('dataGrid.showFilters')}
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
              {t('dataGrid.clearFilters')}
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
                    placeholder={t('dataGrid.filterPlaceholder', { column: header.column.id })}
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
                {t('dataGrid.loading')}
              </p>
            </div>
          </div>
        ) : (
          <table style={tableStyle}>
            <thead style={{ backgroundColor: 'var(--color-border-light)', position: 'sticky', top: 0, zIndex: 10 }}>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header, headerIndex) => (
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
                        borderRight: headerIndex < headerGroup.headers.length - 1 
                          ? '1px solid var(--color-border-default)' 
                          : 'none',
                        borderBottom: '1px solid var(--color-border-default)',
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
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan={table.getHeaderGroups()[0]?.headers.length || 1}
                    className="px-4 py-8 text-center"
                    style={{
                      color: 'var(--color-text-secondary)',
                      borderBottom: '1px solid var(--color-border-default)',
                    }}
                  >
                    {emptyMessage || t('dataGrid.noData')}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`${
                      rowSelection !== false && row.getIsSelected() ? 'bg-blue-50' : ''
                    } ${getRowClassName ? getRowClassName(row.original) : ''}`}
                    onClick={() => {
                      if (rowSelection === 'single') {
                        setRowSelectionState({ [row.id]: !row.getIsSelected() })
                      } else if (rowSelection === 'multiple') {
                        row.toggleSelected()
                      }
                    }}
                    style={{ 
                      cursor: rowSelection !== false ? 'pointer' : 'default',
                      backgroundColor: rowSelection !== false && row.getIsSelected() 
                        ? 'rgba(59, 130, 246, 0.1)' 
                        : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (rowSelection === false || !row.getIsSelected()) {
                        e.currentTarget.style.backgroundColor = 'var(--color-border-light)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (rowSelection === false || !row.getIsSelected()) {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      } else {
                        e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'
                      }
                    }}
                  >
                    {row.getVisibleCells().map((cell, cellIndex, cells) => (
                      <td
                        key={cell.id}
                        className={`px-2 py-1 whitespace-nowrap ${compact ? 'px-0 py-0 text-sm' : ''}`}
                        style={{ 
                          color: 'var(--color-text-primary)',
                          borderRight: cellIndex < cells.length - 1 
                            ? '1px solid var(--color-border-default)' 
                            : 'none',
                          borderBottom: '1px solid var(--color-border-default)',
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <DataGridPagination table={table} enablePagination={enablePagination} />
    </div>
  )
}

