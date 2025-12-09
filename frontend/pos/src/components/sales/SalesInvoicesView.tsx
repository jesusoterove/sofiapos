/**
 * Sales Invoices View - displays paid invoices/orders.
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import { openDatabase } from '@/db/indexeddb'
import { getAllOrders, getOrderItems } from '@/db/queries/orders'
import { useTranslation } from '@/i18n/hooks'
import { AdvancedDataGrid, AdvancedDataGridColumn } from '@sofiapos/ui'

interface Invoice {
  id: string
  order_number: string
  total: number
  subtotal: number
  taxes: number
  discount: number
  created_at: string
  updated_at: string
  items: InvoiceItem[]
}

interface InvoiceItem {
  id: string
  product_name: string
  quantity: number
  unit_price: number
  total: number
  tax_amount: number
}

export function SalesInvoicesView({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

  useEffect(() => {
    loadInvoices()
  }, [])

  const loadInvoices = async () => {
    try {
      setLoading(true)
      const db = await openDatabase()
      const paidOrders = await getAllOrders(db, 'paid')
      
      // Load items for each order
      const invoicesWithItems = await Promise.all(
        paidOrders.map(async (order) => {
          const items = await getOrderItems(db, order.id)
          return {
            ...order,
            items: items.map((item) => ({
              id: item.id,
              product_name: item.product_name,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total: item.total,
              tax_amount: item.tax_amount,
            })),
          }
        })
      )
      
      // Sort by date (newest first)
      invoicesWithItems.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime()
        const dateB = new Date(b.created_at).getTime()
        return dateB - dateA
      })
      
      setInvoices(invoicesWithItems as Invoice[])
    } catch (error) {
      console.error('Failed to load invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Handle row click to show invoice details
  const handleRowClick = useCallback((event: any) => {
    const invoice = event.data as Invoice
    if (invoice) {
      setSelectedInvoice(invoice)
    }
  }, [])

  // Grid columns
  const columns: AdvancedDataGridColumn[] = useMemo(() => [
    {
      headerName: t('sales.invoiceNumber') || 'Invoice Number',
      field: 'order_number',
      width: 150,
      sortable: true,
    },
    {
      headerName: t('sales.date') || 'Date',
      field: 'created_at',
      width: 180,
      sortable: true,
      cellRenderer: (params: any) => formatDateTime(params.value),
    },
    {
      headerName: t('common.subtotal') || 'Subtotal',
      field: 'subtotal',
      width: 120,
      sortable: true,
      cellRenderer: (params: any) => formatCurrency(params.value || 0),
    },
    {
      headerName: t('common.discount') || 'Discount',
      field: 'discount',
      width: 120,
      sortable: true,
      cellRenderer: (params: any) => formatCurrency(params.value || 0),
    },
    {
      headerName: t('common.tax') || 'Tax',
      field: 'taxes',
      width: 120,
      sortable: true,
      cellRenderer: (params: any) => formatCurrency(params.value || 0),
    },
    {
      headerName: t('common.total') || 'Total',
      field: 'total',
      width: 130,
      sortable: true,
      cellRenderer: (params: any) => (
        <span style={{ color: 'var(--color-success-600, #16A34A)', fontWeight: 'bold' }}>
          {formatCurrency(params.value || 0)}
        </span>
      ),
    },
  ], [t])

  // Grid options with row click handler
  const gridOptions = useMemo(() => ({
    onRowClicked: handleRowClick,
    getRowClass: () => 'cursor-pointer',
  }), [handleRowClick])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">{t('common.loading') || 'Loading...'}</div>
        </div>
      </div>
    )
  }

  if (selectedInvoice) {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border-default, #E5E7EB)' }}>
          <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary, #111827)' }}>
            {t('sales.invoiceDetails') || 'Invoice Details'}
          </h2>
          <button
            onClick={() => setSelectedInvoice(null)}
            className="px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ color: 'var(--color-text-primary, #111827)' }}
          >
            {t('common.back') || 'Back'}
          </button>
        </div>

        {/* Invoice Details */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4">
            <div className="text-sm" style={{ color: 'var(--color-text-secondary, #6B7280)' }}>
              {t('sales.invoiceNumber') || 'Invoice Number'}
            </div>
            <div className="text-lg font-semibold" style={{ color: 'var(--color-text-primary, #111827)' }}>
              {selectedInvoice.order_number}
            </div>
          </div>

          <div className="mb-4">
            <div className="text-sm" style={{ color: 'var(--color-text-secondary, #6B7280)' }}>
              {t('sales.date') || 'Date'}
            </div>
            <div className="text-lg" style={{ color: 'var(--color-text-primary, #111827)' }}>
              {formatDateTime(selectedInvoice.created_at)}
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary, #111827)' }}>
              {t('order.items') || 'Items'}
            </h3>
            <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-border-default, #E5E7EB)' }}>
              <table className="w-full">
                <thead style={{ backgroundColor: 'var(--color-bg-secondary, #F9FAFB)' }}>
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--color-text-primary, #111827)' }}>
                      {t('order.item') || 'Item'}
                    </th>
                    <th className="px-4 py-2 text-right text-sm font-medium" style={{ color: 'var(--color-text-primary, #111827)' }}>
                      {t('common.quantity') || 'Qty'}
                    </th>
                    <th className="px-4 py-2 text-right text-sm font-medium" style={{ color: 'var(--color-text-primary, #111827)' }}>
                      {t('common.price') || 'Price'}
                    </th>
                    <th className="px-4 py-2 text-right text-sm font-medium" style={{ color: 'var(--color-text-primary, #111827)' }}>
                      {t('common.total') || 'Total'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items.map((item) => (
                    <tr key={item.id} className="border-t" style={{ borderColor: 'var(--color-border-default, #E5E7EB)' }}>
                      <td className="px-4 py-2" style={{ color: 'var(--color-text-primary, #111827)' }}>
                        {item.product_name}
                      </td>
                      <td className="px-4 py-2 text-right" style={{ color: 'var(--color-text-primary, #111827)' }}>
                        {item.quantity}
                      </td>
                      <td className="px-4 py-2 text-right" style={{ color: 'var(--color-text-primary, #111827)' }}>
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="px-4 py-2 text-right font-medium" style={{ color: 'var(--color-text-primary, #111827)' }}>
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="border-t pt-4" style={{ borderColor: 'var(--color-border-default, #E5E7EB)' }}>
            <div className="flex justify-between mb-2">
              <span style={{ color: 'var(--color-text-secondary, #6B7280)' }}>
                {t('common.subtotal') || 'Subtotal'}
              </span>
              <span style={{ color: 'var(--color-text-primary, #111827)' }}>
                {formatCurrency(selectedInvoice.subtotal)}
              </span>
            </div>
            {selectedInvoice.discount > 0 && (
              <div className="flex justify-between mb-2">
                <span style={{ color: 'var(--color-text-secondary, #6B7280)' }}>
                  {t('common.discount') || 'Discount'}
                </span>
                <span style={{ color: 'var(--color-text-primary, #111827)' }}>
                  -{formatCurrency(selectedInvoice.discount)}
                </span>
              </div>
            )}
            <div className="flex justify-between mb-2">
              <span style={{ color: 'var(--color-text-secondary, #6B7280)' }}>
                {t('common.tax') || 'Tax'}
              </span>
              <span style={{ color: 'var(--color-text-primary, #111827)' }}>
                {formatCurrency(selectedInvoice.taxes)}
              </span>
            </div>
            <div className="flex justify-between text-xl font-bold pt-2 border-t" style={{ borderColor: 'var(--color-border-default, #E5E7EB)', color: 'var(--color-text-primary, #111827)' }}>
              <span>{t('common.total') || 'Total'}</span>
              <span>{formatCurrency(selectedInvoice.total)}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border-default, #E5E7EB)' }}>
        <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary, #111827)' }}>
          {t('sales.invoices') || 'Sales Invoices'}
        </h2>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          style={{ color: 'var(--color-text-primary, #111827)' }}
        >
          {t('common.back') || 'Back'}
        </button>
      </div>

      {/* AdvancedDataGrid */}
      <div className="flex-1 p-4">
        <AdvancedDataGrid
          rowData={invoices}
          columnDefs={columns}
          enableSorting={true}
          enableFiltering={true}
          enablePagination={true}
          paginationPageSize={20}
          loading={loading}
          emptyMessage={t('sales.noInvoices') || 'No paid invoices found'}
          height="100%"
          gridOptions={gridOptions}
        />
      </div>
    </div>
  )
}

