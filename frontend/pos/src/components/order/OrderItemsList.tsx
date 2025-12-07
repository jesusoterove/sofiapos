/**
 * Order items list component using DataGrid.
 */
import { useMemo } from 'react'
import { DataGrid, DataGridColumn, IconButton } from '@sofiapos/ui'
import { FaMinus, FaPlus, FaTimes } from 'react-icons/fa'
import { useTranslation } from '@/i18n/hooks'

export interface OrderItemData {
  id: string
  productId: number
  productName: string
  quantity: number
  unitPrice: number
  total: number
}

interface OrderItemsListProps {
  items: OrderItemData[]
  onUpdateQuantity: (itemId: string, quantity: number) => void
  onRemoveItem: (itemId: string) => void
}

export function OrderItemsList({ items, onUpdateQuantity, onRemoveItem }: OrderItemsListProps) {
  const { t } = useTranslation()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  const columns = useMemo<DataGridColumn<OrderItemData>[]>(() => [
    {
      id: 'productName',
      headerName: t('order.item') || 'Item',
      accessorKey: 'productName',
      cellRenderer: ({ row }: { value: any; row: OrderItemData; column: DataGridColumn<OrderItemData> }) => (
        <div>
          <div className="font-medium text-sm" style={{ color: 'var(--color-text-primary, #111827)' }}>
            {row.productName}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--color-text-secondary, #6B7280)' }}>
            {formatPrice(row.unitPrice)} {t('common.price') || 'each'}
          </div>
        </div>
      ),
      minWidth: 200,
      flex: 1,
      sortable: false,
    },
    {
      id: 'quantity',
      headerName: t('common.quantity') || 'Quantity',
      accessorKey: 'quantity',
      cellRenderer: ({ row }: { value: any; row: OrderItemData; column: DataGridColumn<OrderItemData> }) => {
        const item = row
        return (
          <div className="flex items-center gap-1 justify-center">
            <IconButton
              variant="secondary"
              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
              className="h-8 w-8 p-0 flex items-center justify-center"
              title={t('common.remove') || 'Decrease'}
            >
              <FaMinus />
            </IconButton>
            <span className="w-10 text-center font-medium" style={{ color: 'var(--color-text-primary, #111827)' }}>
              {item.quantity}
            </span>
            <IconButton
              variant="secondary"
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              className="h-8 w-8 p-0 flex items-center justify-center"
              title={t('common.add') || 'Increase'}
            >
              <FaPlus />
            </IconButton>
          </div>
        )
      },
      width: 150,
      sortable: false,
    },
    {
      id: 'total',
      headerName: t('common.total') || 'Total',
      accessorKey: 'total',
      type: 'money',
      cellRendererOptions: {
        align: 'right',
        decPlaces: 0,
        formatAsMoney: true,
      },
      width: 100,
      sortable: false,
    },
    {
      id: '',
      headerName: '',
      cellRenderer: ({ row }: { value: any; row: OrderItemData; column: DataGridColumn<OrderItemData> }) => {
        const item = row
        return (
          <div className="flex items-center justify-center">
            <button
              onClick={() => onRemoveItem(item.id)}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              style={{ color: 'var(--color-danger-500, #EF4444)' }}
              title={t('common.remove') || 'Remove item'}
              aria-label={t('common.remove') || 'Remove item'}
            >
              <FaTimes />
            </button>
          </div>
        )
      },
      width: 20,
      sortable: false,
    },
  ], [t, onUpdateQuantity, onRemoveItem])

  return (
    <DataGrid
      data={items}
      columns={columns}
      enableSorting={false}
      enableFiltering={false}
      enablePagination={false}
      emptyMessage={t('order.noItems') || 'No items in order'}
      compact={true}
      className="border-0"
    />
  )
}

