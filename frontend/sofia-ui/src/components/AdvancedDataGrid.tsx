/**
 * AdvancedDataGrid component - A wrapper for ag-grid-community
 * Provides a React-friendly interface to ag-grid with common configurations
 */
import React, { useMemo, useCallback, useRef, useEffect } from 'react'
import { AgGridReact } from 'ag-grid-react'
import type {
  ColDef,
  GridOptions,
  GridReadyEvent,
  SelectionChangedEvent,
  IServerSideDatasource,
  RowStyle,
  RowClassParams,
  RowSelectionOptions,
} from 'ag-grid-community'
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import { useTheme } from '../theme/ThemeContext'

// Register all community modules
ModuleRegistry.registerModules([AllCommunityModule])

export interface AdvancedDataGridColumn {
  /** Column field identifier */
  field: string
  /** Column header name */
  headerName?: string
  /** Column width */
  width?: number
  /** Minimum column width */
  minWidth?: number
  /** Maximum column width */
  maxWidth?: number
  /** Enable sorting */
  sortable?: boolean
  /** Enable filtering */
  filter?: boolean | string
  /** Enable resizing */
  resizable?: boolean
  /** Pin column to left or right */
  pinned?: 'left' | 'right'
  /** Cell renderer function or component */
  cellRenderer?: string | ((params: any) => React.ReactNode)
  /** Cell value formatter */
  valueFormatter?: (params: any) => string
  /** Cell value getter */
  valueGetter?: (params: any) => any
  /** Cell value setter */
  valueSetter?: (params: any) => boolean
  /** Cell editor */
  cellEditor?: string | any
  /** Cell editor parameters */
  cellEditorParams?: any
  /** Column type */
  type?: string
  /** Enable checkbox selection for this column */
  checkboxSelection?: boolean
  /** Header checkbox selection */
  headerCheckboxSelection?: boolean
  /** Column flex (for responsive sizing) */
  flex?: number
  /** Hide column */
  hide?: boolean
  /** Lock column position */
  lockPosition?: boolean
  /** Lock pinned position */
  lockPinned?: boolean
  /** Additional ag-grid column properties */
  [key: string]: any
}

export interface AdvancedDataGridProps<T = any> {
  /** Data rows */
  rowData: T[]
  /** Column definitions */
  columnDefs: AdvancedDataGridColumn[]
  /** Enable sorting */
  enableSorting?: boolean
  /** Enable filtering */
  enableFiltering?: boolean
  /** Enable pagination */
  enablePagination?: boolean
  /** Page size for pagination */
  paginationPageSize?: number
  /** Enable row selection */
  rowSelection?: 'single' | 'multiple' | false
  /** Callback when row selection changes */
  onSelectionChanged?: (selectedRows: T[]) => void
  /** Callback when grid is ready */
  onGridReady?: (event: GridReadyEvent) => void
  /** Loading state */
  loading?: boolean
  /** Empty state message */
  emptyMessage?: string
  /** Height of the grid */
  height?: string | number
  /** Width of the grid */
  width?: string | number
  /** Custom className */
  className?: string
  /** Theme className - deprecated, use theme from ThemeContext instead */
  theme?: string
  /** Enable column resizing */
  enableColumnResize?: boolean
  /** Enable column reordering */
  enableColumnReorder?: boolean
  /** Enable row grouping */
  enableRowGroup?: boolean
  /** Enable pivot mode */
  enablePivot?: boolean
  /** Enable range selection (deprecated, use cellSelection instead) */
  enableRangeSelection?: boolean
  /** Enable cell selection (replaces enableRangeSelection) */
  cellSelection?: boolean
  /** Show row numbers */
  showRowNumbers?: boolean
  /** Custom row class name (deprecated, use getRowClass instead) */
  getRowClassName?: (params: any) => string
  /** Custom row class */
  getRowClass?: (params: any) => string | string[]
  /** Custom row style */
  getRowStyle?: (params: RowClassParams) => RowStyle | undefined
  /** Suppress row click selection (deprecated, use rowSelection.enableClickSelection instead) */
  suppressRowClickSelection?: boolean
  /** Enable row click selection (inverse of suppressRowClickSelection)
   * Can be true (enable both), false (disable), 'enableSelection', or 'enableDeselection'
   */
  enableClickSelection?: boolean | 'enableSelection' | 'enableDeselection'
  /** Additional ag-grid options */
  gridOptions?: Partial<GridOptions>
  /** Server-side datasource */
  datasource?: IServerSideDatasource
  /** Enable server-side row model */
  serverSideRowModel?: boolean
}

export function AdvancedDataGrid<T extends Record<string, any> = any>({
  rowData,
  columnDefs,
  enableSorting = true,
  enableFiltering = false,
  enablePagination = true,
  paginationPageSize = 20,
  rowSelection = false,
  onSelectionChanged,
  onGridReady,
  loading = false,
  emptyMessage,
  height = '600px',
  width = '100%',
  className = '',
  enableColumnResize = true,
  enableColumnReorder = true,
  enableRowGroup = false,
  // Note: enableColumnReorder is available but not directly configurable in gridOptions
  // It's controlled by the suppressMovableColumns property (inverse)
  enablePivot = false,
  enableRangeSelection = false,
  cellSelection,
  showRowNumbers = false,
  getRowClassName,
  getRowClass,
  getRowStyle,
  suppressRowClickSelection = false,
  enableClickSelection,
  gridOptions = {},
  datasource,
  serverSideRowModel = false,
}: AdvancedDataGridProps<T>) {
  const gridRef = useRef<AgGridReact>(null)
  const { currentTheme } = useTheme()

  // Transform column definitions to ag-grid format
  const agColumnDefs = useMemo<ColDef[]>(() => {
    const transformed: ColDef[] = []

    // Add row number column if enabled
    if (showRowNumbers) {
      transformed.push({
        field: '__rowNumber',
        headerName: '#',
        width: 60,
        sortable: false,
        filter: false,
        resizable: false,
        cellRenderer: (params: any) => {
          if (serverSideRowModel) {
            return params.node.rowIndex + 1
          }
          return params.node.rowIndex + 1
        },
        pinned: 'left',
        lockPinned: true,
      })
    }

    // Transform custom column definitions
    columnDefs.forEach((col) => {
      const agCol: ColDef = {
        field: col.field,
        headerName: col.headerName || col.field,
        width: col.width,
        minWidth: col.minWidth,
        maxWidth: col.maxWidth,
        sortable: col.sortable !== undefined ? col.sortable : enableSorting,
        filter: col.filter !== undefined ? col.filter : enableFiltering,
        resizable: col.resizable !== undefined ? col.resizable : enableColumnResize,
        pinned: col.pinned,
        cellRenderer: col.cellRenderer || undefined,
        valueFormatter: col.valueFormatter,
        valueGetter: col.valueGetter,
        valueSetter: col.valueSetter,
        cellEditor: col.cellEditor,
        cellEditorParams: col.cellEditorParams,
        type: col.type,
        checkboxSelection: col.checkboxSelection,
        headerCheckboxSelection: col.headerCheckboxSelection,
        flex: col.flex,
        hide: col.hide,
        lockPosition: col.lockPosition,
        lockPinned: col.lockPinned,
        ...Object.fromEntries(
          Object.entries(col).filter(([key]) => 
            !['field', 'headerName', 'width', 'minWidth', 'maxWidth', 'sortable', 
              'filter', 'resizable', 'pinned', 'cellRenderer', 'valueFormatter', 
              'valueGetter', 'valueSetter', 'cellEditor', 'cellEditorParams', 
              'type', 'checkboxSelection', 'headerCheckboxSelection', 'flex', 
              'hide', 'lockPosition', 'lockPinned'].includes(key)
          )
        ),
      }
      transformed.push(agCol)
    })

    return transformed
  }, [
    columnDefs,
    enableSorting,
    enableFiltering,
    enableColumnResize,
    showRowNumbers,
    serverSideRowModel,
  ])

  // Handle selection changes
  const handleSelectionChanged = useCallback(
    (event: SelectionChangedEvent) => {
      if (onSelectionChanged) {
        const selectedRows: T[] = []
        event.api.getSelectedRows().forEach((row: any) => {
          selectedRows.push(row as T)
        })
        onSelectionChanged(selectedRows)
      }
    },
    [onSelectionChanged]
  )

  // Build row selection configuration
  // ag-grid 34 uses object with mode: 'singleRow' | 'multiRow' and enableClickSelection
  const rowSelectionOptions = useMemo<RowSelectionOptions | undefined>(() => {
    if (rowSelection === false) {
      return undefined
    }
    
    // Determine enableClickSelection value
    // If enableClickSelection is explicitly provided, use it
    // Otherwise, derive from suppressRowClickSelection (inverse)
    let enableClick: boolean | 'enableSelection' | 'enableDeselection' = true
    if (enableClickSelection !== undefined) {
      enableClick = enableClickSelection
    } else if (suppressRowClickSelection) {
      enableClick = false
    }
    
    const mode = rowSelection === 'single' ? 'singleRow' as const : 'multiRow' as const
    
    if (mode === 'singleRow') {
      return {
        mode: 'singleRow',
        enableClickSelection: enableClick,
      } as RowSelectionOptions
    } else {
      return {
        mode: 'multiRow',
        checkboxes: rowSelection === 'multiple',
        enableClickSelection: enableClick,
      } as RowSelectionOptions
    }
  }, [rowSelection, enableClickSelection, suppressRowClickSelection])

  // Build grid options
  const finalGridOptions: GridOptions = useMemo(
    () => ({
      ...gridOptions,
      theme: currentTheme.agGridTheme,
      defaultColDef: {
        sortable: enableSorting,
        filter: enableFiltering,
        resizable: enableColumnResize,
        ...gridOptions.defaultColDef,
      },
      pagination: enablePagination,
      paginationPageSize: paginationPageSize,
      rowSelection: rowSelectionOptions,
      getRowClass: getRowClass || (getRowClassName ? (params: RowClassParams) => getRowClassName(params) : undefined),
      getRowStyle: getRowStyle ? (params: RowClassParams) => {
        const style = getRowStyle(params)
        // Convert React.CSSProperties to RowStyle (which is a Record<string, string>)
        if (style) {
          const rowStyle: RowStyle = {}
          Object.keys(style).forEach((key) => {
            const value = (style as any)[key]
            if (value != null && value !== '') {
              rowStyle[key] = String(value)
            }
          })
          return rowStyle
        }
        return undefined
      } : undefined,
      cellSelection: cellSelection !== undefined ? cellSelection : enableRangeSelection,
      rowGroupPanelShow: enableRowGroup ? 'always' : undefined,
      pivotPanelShow: enablePivot ? 'always' : undefined,
      suppressMovableColumns: !enableColumnReorder,
      animateRows: true,
      // rowHeight: 40,
      // headerHeight: 40,
      overlayNoRowsTemplate: emptyMessage 
        ? `<div style="padding: 20px; text-align: center; color: var(--color-text-secondary);">${emptyMessage}</div>`
        : undefined,
      ...(serverSideRowModel && datasource
        ? {
            rowModelType: 'serverSide',
            serverSideDatasource: datasource,
          }
        : {}),
    }),
    [
      gridOptions,
      currentTheme.agGridTheme,
      enableSorting,
      enableFiltering,
      enablePagination,
      paginationPageSize,
      rowSelectionOptions,
      getRowClass,
      getRowClassName,
      getRowStyle,
      cellSelection,
      enableRangeSelection,
      enableRowGroup,
      enablePivot,
      enableColumnReorder,
      serverSideRowModel,
      datasource,
      emptyMessage,
    ]
  )

  // Grid container style
  const gridStyle: React.CSSProperties = useMemo(
    () => ({
      height: typeof height === 'number' ? `${height}px` : height,
      width: typeof width === 'number' ? `${width}px` : width,
    }),
    [height, width]
  )

  // Handle grid ready
  const handleGridReady = useCallback(
    (event: GridReadyEvent) => {
      if (onGridReady) {
        onGridReady(event)
      }
    },
    [onGridReady]
  )

  // Update loading overlay and handle empty state
  useEffect(() => {
    if (gridRef.current?.api) {
      if (loading) {
        gridRef.current.api.showLoadingOverlay()
      } else {
        gridRef.current.api.hideOverlay()
        // Show no rows overlay if data is empty
        if (rowData.length === 0 && !serverSideRowModel) {
          gridRef.current.api.showNoRowsOverlay()
        }
      }
    }
  }, [loading, rowData.length, serverSideRowModel])

  return (
    <div className={`advanced-data-grid ${className}`} style={gridStyle}>
      <div style={gridStyle}>
        <AgGridReact
          ref={gridRef}
          rowData={serverSideRowModel ? undefined : rowData}
          columnDefs={agColumnDefs}
          gridOptions={finalGridOptions}
          onGridReady={handleGridReady}
          onSelectionChanged={handleSelectionChanged}
          animateRows={true}
          rowHeight={40}
          headerHeight={40}
        />
      </div>
    </div>
  )
}

