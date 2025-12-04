/**
 * Pagination component for DataGrid.
 * Uses LanguageContext for internationalization.
 */
import React from 'react'
import { Table } from '@tanstack/react-table'
import { useTranslation } from '../i18n/hooks'

export interface DataGridPaginationProps<T> {
  table: Table<T>
  enablePagination: boolean
}

export function DataGridPagination<T>({ table, enablePagination }: DataGridPaginationProps<T>) {
  const { t } = useTranslation()

  if (!enablePagination) {
    return null
  }

  const paginationState = table.getState().pagination
  const currentPage = paginationState.pageIndex + 1
  const totalPages = table.getPageCount()
  const pageSize = paginationState.pageSize
  const totalRows = table.getFilteredRowModel().rows.length
  const startRow = paginationState.pageIndex * pageSize + 1
  const endRow = Math.min(startRow + pageSize - 1, totalRows)

  const buttonStyle: React.CSSProperties = {
    padding: '0.25rem 0.75rem',
    border: '1px solid var(--color-border-default)',
    borderRadius: '0.25rem',
    backgroundColor: 'var(--color-bg-paper)',
    color: 'var(--color-text-primary)',
    cursor: 'pointer',
    fontSize: '0.875rem',
  }

  const disabledButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    opacity: 0.5,
    cursor: 'not-allowed',
  }

  const selectStyle: React.CSSProperties = {
    padding: '0.25rem 0.5rem',
    border: '1px solid var(--color-border-default)',
    borderRadius: '0.25rem',
    backgroundColor: 'var(--color-bg-paper)',
    color: 'var(--color-text-primary)',
    fontSize: '0.875rem',
  }

  return (
    <div
      className="data-grid-pagination"
      style={{
        padding: '0.5rem',
        borderTop: '1px solid var(--color-border-default)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem',
      }}
    >
      {/* Pagination Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <button
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          style={!table.getCanPreviousPage() ? disabledButtonStyle : buttonStyle}
          onMouseEnter={(e) => {
            if (table.getCanPreviousPage()) {
              e.currentTarget.style.backgroundColor = 'var(--color-border-light)'
            }
          }}
          onMouseLeave={(e) => {
            if (table.getCanPreviousPage()) {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-paper)'
            }
          }}
          title={t('pagination.firstPage')}
        >
          {'<<'}
        </button>
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          style={!table.getCanPreviousPage() ? disabledButtonStyle : buttonStyle}
          onMouseEnter={(e) => {
            if (table.getCanPreviousPage()) {
              e.currentTarget.style.backgroundColor = 'var(--color-border-light)'
            }
          }}
          onMouseLeave={(e) => {
            if (table.getCanPreviousPage()) {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-paper)'
            }
          }}
          title={t('pagination.previousPage')}
        >
          {'<'}
        </button>
        <span
          style={{
            padding: '0 1rem',
            color: 'var(--color-text-secondary)',
            fontSize: '0.875rem',
          }}
        >
          {t('pagination.pageInfo', { current: currentPage, total: totalPages })}
        </span>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          style={!table.getCanNextPage() ? disabledButtonStyle : buttonStyle}
          onMouseEnter={(e) => {
            if (table.getCanNextPage()) {
              e.currentTarget.style.backgroundColor = 'var(--color-border-light)'
            }
          }}
          onMouseLeave={(e) => {
            if (table.getCanNextPage()) {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-paper)'
            }
          }}
          title={t('pagination.nextPage')}
        >
          {'>'}
        </button>
        <button
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
          style={!table.getCanNextPage() ? disabledButtonStyle : buttonStyle}
          onMouseEnter={(e) => {
            if (table.getCanNextPage()) {
              e.currentTarget.style.backgroundColor = 'var(--color-border-light)'
            }
          }}
          onMouseLeave={(e) => {
            if (table.getCanNextPage()) {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-paper)'
            }
          }}
          title={t('pagination.lastPage')}
        >
          {'>>'}
        </button>
      </div>

      {/* Rows per page selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          {t('pagination.rowsPerPage')}:
        </span>
        <select
          value={pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
          style={selectStyle}
        >
          {[10, 20, 30, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      {/* Row count info */}
      <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
        {t('pagination.showingRows', { start: startRow, end: endRow, total: totalRows })}
      </div>
    </div>
  )
}

