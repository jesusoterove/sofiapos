/**
 * Sales page component.
 */
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from '@/i18n/hooks'
import { getSalesSummary, getSalesDetails } from '@/api/sales'
import { storesApi } from '@/api/stores'
import { cashRegistersApi } from '@/api/cashRegisters'
import type { SalesFilterRequest, SalesDetailsRequest, SalesSummaryResponse, SalesDetailsResponse } from '@/types/sales'
import { AdvancedDataGrid, AdvancedDataGridColumn } from '@sofiapos/ui'
// Date formatting utility
const formatDateTime = (dateStr: string | null | undefined) => {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

type FilterMode = 'today' | 'yesterday' | 'current_shift' | 'last_shift' | 'last_week' | 'last_month' | 'date_range'

export function Sales() {
  const { t } = useTranslation()
  
  const [storeId, setStoreId] = useState<number | null>(null)
  const [cashRegisterId, setCashRegisterId] = useState<number | null>(null)
  const [filterMode, setFilterMode] = useState<FilterMode>('today')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const pageSize = 20

  // Fetch stores
  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storesApi.list(false),
  })

  // Fetch cash registers
  const { data: cashRegisters = [] } = useQuery({
    queryKey: ['cashRegisters', storeId],
    queryFn: () => cashRegistersApi.list(storeId || undefined),
    enabled: !!storeId,
  })

  // Build filter request
  const filterRequest: SalesFilterRequest = {
    store_id: storeId,
    cash_register_id: cashRegisterId,
    filter_mode: filterMode,
    start_date: filterMode === 'date_range' && startDate ? startDate : null,
    end_date: filterMode === 'date_range' && endDate ? endDate : null,
  }

  // Build details request with pagination
  const detailsRequest: SalesDetailsRequest = {
    ...filterRequest,
    page: currentPage,
    page_size: pageSize,
  }

  // Fetch sales summary (only once, no pagination)
  const { data: summaryData, isLoading: isLoadingSummary } = useQuery<SalesSummaryResponse>({
    queryKey: ['sales-summary', filterRequest],
    queryFn: () => getSalesSummary(filterRequest),
    enabled: filterMode !== 'current_shift' && filterMode !== 'last_shift' || !!cashRegisterId,
  })

  // Fetch sales details (paginated)
  const { data: detailsData, isLoading: isLoadingDetails } = useQuery<SalesDetailsResponse>({
    queryKey: ['sales-details', detailsRequest],
    queryFn: () => getSalesDetails(detailsRequest),
    enabled: filterMode !== 'current_shift' && filterMode !== 'last_shift' || !!cashRegisterId,
  })

  // Reset cash register when store changes
  useEffect(() => {
    setCashRegisterId(null)
    // Reset to default filter mode when store changes
    if (!storeId) {
      setFilterMode('today')
    }
  }, [storeId])

  // When cash register is selected, default to current_shift if filter mode is not shift-related
  useEffect(() => {
    if (cashRegisterId && filterMode !== 'current_shift' && filterMode !== 'last_shift') {
      setFilterMode('current_shift')
    }
  }, [cashRegisterId])

  // When cash register is deselected, switch to today if current filter requires cash register
  useEffect(() => {
    if (!cashRegisterId && (filterMode === 'current_shift' || filterMode === 'last_shift')) {
      setFilterMode('today')
    }
  }, [cashRegisterId, filterMode])


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Grid columns
  const columns: AdvancedDataGridColumn[] = [
    {
      headerName: t('sales.orderId') || 'Order ID',
      field: 'order_id',
      width: 100,
    },
    {
      headerName: t('sales.orderNumber') || 'Order Number',
      field: 'order_number',
      width: 150,
    },
    {
      headerName: t('sales.tableNumber') || 'Table #',
      field: 'table_number',
      width: 100,
    },
    {
      headerName: t('sales.customerName') || 'Customer Name',
      field: 'customer_name',
      width: 200,
    },
    {
      headerName: t('sales.cashPaid') || 'Cash Paid',
      field: 'cash_paid',
      width: 120,
      cellRenderer: (params: any) => formatCurrency(params.value || 0),
    },
    {
      headerName: t('sales.otherPaid') || 'Other Paid',
      field: 'other_paid',
      width: 120,
      cellRenderer: (params: any) => formatCurrency(params.value || 0),
    },
    {
      headerName: t('sales.date') || 'Date',
      field: 'date',
      width: 180,
      cellRenderer: (params: any) => formatDateTime(params.value),
    },
  ]

  return (
    <div className="p-3 pb-0">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">{t('sales.title') || 'Sales'}</h1>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Store Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('sales.store') || 'Store'}
            </label>
            <select
              value={storeId || ''}
              onChange={(e) => setStoreId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('sales.all') || 'All'}</option>
              {stores.map((store: { id: number; name: string }) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>

          {/* Cash Register Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('sales.cashRegister') || 'Cash Register'}
            </label>
            <select
              value={cashRegisterId || ''}
              onChange={(e) => setCashRegisterId(e.target.value ? Number(e.target.value) : null)}
              disabled={!storeId}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">{t('sales.all') || 'All'}</option>
              {cashRegisters.map((cr: { id: number; name: string; code: string }) => (
                <option key={cr.id} value={cr.id}>
                  {cr.name} ({cr.code})
                </option>
              ))}
            </select>
          </div>

          {/* Filter Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('sales.filterMode') || 'Filter Mode'}
            </label>
            <select
              value={filterMode}
              onChange={(e) => {
                setFilterMode(e.target.value as FilterMode)
                setCurrentPage(1) // Reset to first page when filter changes
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {cashRegisterId && (
                <>
                  <option value="current_shift">
                    {t('sales.currentShift') || 'Current Shift'}
                  </option>
                  <option value="last_shift">
                    {t('sales.lastShift') || 'Last Shift'}
                  </option>
                </>
              )}
              <option value="today">{t('sales.today') || 'Today'}</option>
              <option value="yesterday">{t('sales.yesterday') || 'Yesterday'}</option>
              <option value="last_week">{t('sales.lastWeek') || 'Last Week'}</option>
              <option value="last_month">{t('sales.lastMonth') || 'Last Month'}</option>
              <option value="date_range">{t('sales.dateRange') || 'Date Range'}</option>
            </select>
          </div>

          {/* Date Range Inputs */}
          {filterMode === 'date_range' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('sales.startDate') || 'Start Date'}
                </label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('sales.endDate') || 'End Date'}
                </label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Info Row */}
        {summaryData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded">
            <div>
              <span className="text-sm font-medium text-gray-700">
                {t('sales.startDateTime') || 'Start Date/Time'}:{' '}
              </span>
              <span className="text-sm">{formatDateTime(summaryData.start_date)}</span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">
                {t('sales.endDateTime') || 'End Date/Time'}:{' '}
              </span>
              <span className="text-sm">{formatDateTime(summaryData.end_date)}</span>
            </div>
            {summaryData.cash_register_user && (
              <div>
                <span className="text-sm font-medium text-gray-700">
                  {t('sales.cashRegisterUser') || 'User'}:{' '}
                </span>
                <span className="text-sm">{summaryData.cash_register_user}</span>
              </div>
            )}
          </div>
        )}

        {/* Summary Row */}
        {summaryData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-3 bg-blue-50 rounded">
            {summaryData.summary.beginning_balance !== null && summaryData.summary.beginning_balance !== undefined && (
              <div>
                <span className="text-sm font-medium text-gray-700">
                  {t('sales.begBalance') || 'Beg Balance'}:{' '}
                </span>
                <span className="text-sm font-semibold">{formatCurrency(summaryData.summary.beginning_balance)}</span>
              </div>
            )}
            <div>
              <span className="text-sm font-medium text-gray-700">
                {t('sales.totalSales') || 'Total Sales'}:{' '}
              </span>
              <span className="text-sm font-semibold">{formatCurrency(summaryData.summary.total_sales)}</span>
            </div>
            {summaryData.summary.payment_methods.map((pm: { payment_method_name: string; total_amount: number }) => (
              <div key={pm.payment_method_name}>
                <span className="text-sm font-medium text-gray-700">
                  {t('sales.total') || 'Total'} {pm.payment_method_name}:{' '}
                </span>
                <span className="text-sm font-semibold">{formatCurrency(pm.total_amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Section */}
      <div className="bg-white rounded-lg shadow">
        <AdvancedDataGrid
          rowData={detailsData?.details || []}
          columnDefs={columns}
          height="600px"
          rowSelection={{ mode: 'singleRow' }}
        />
        {/* Pagination Controls */}
        {detailsData && detailsData.total_pages > 1 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              {t('sales.showing') || 'Showing'} {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, detailsData.total_count)} {t('sales.of') || 'of'} {detailsData.total_count}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                {t('sales.previous') || 'Previous'}
              </button>
              <span className="px-3 py-1 text-sm">
                {t('sales.page') || 'Page'} {currentPage} {t('sales.of') || 'of'} {detailsData.total_pages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(detailsData.total_pages, prev + 1))}
                disabled={currentPage === detailsData.total_pages}
                className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                {t('sales.next') || 'Next'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

