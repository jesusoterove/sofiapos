/**
 * Products management page.
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'react-toastify'
import { useTranslation } from '@/i18n/hooks'
import { productsApi, Product } from '@/api/products'
import { useSettings } from '@/contexts/SettingsContext'
import { Button, AdvancedDataGrid, AdvancedDataGridColumn, messageBox, NumberCellRenderer, YesNoCellRenderer } from '@sofiapos/ui'
import { FaEdit, FaTrash } from 'react-icons/fa'

export function ProductList() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { moneyDecimalPlaces } = useSettings()
  const [activeOnly, setActiveOnly] = useState(false)

  // Fetch products
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['products', activeOnly],
    queryFn: () => productsApi.list(0, 100, activeOnly),
  })


  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success(t('inventory.productDeleteSuccess') || 'Product deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('inventory.productDeleteError') || 'Failed to delete product')
    },
  })

  const handleCreate = () => {
    navigate({ to: '/inventory/products/new' })
  }

  const handleEdit = (product: Product) => {
    navigate({ to: `/inventory/products/${product.id}` })
  }

  const handleDelete = async (product: Product) => {
    const message = (t('common.deleteConfirmMessage') || 'Are you sure you want to delete "{{name}}"?').replace('{{name}}', product.name)
    const result = await messageBox.ask(message, undefined, 'YesNo')
    if (result.value === true) {
      deleteMutation.mutate(product.id)
    }
  }

  const columns: AdvancedDataGridColumn<Product>[] = [
    {
      field: 'code',
      headerName: t('inventory.productCode') || 'Code',
      sortable: true,
      filter: true,
      flex: 2,
    },
    {
      field: 'name',
      headerName: t('inventory.productName') || 'Name',
      sortable: true,
      filter: true,
      flex: 4,
    },
    {
      field: 'product_type',
      headerName: t('inventory.productType') || 'Type',
      sortable: true,
      filter: true,
      valueGetter: (params: any) => t(`inventory.productTypeEnum.${params.data.product_type}`),
      flex: 2,
    },
    {
      field: 'selling_price',
      headerName: t('inventory.sellingPrice') || 'Selling Price',
      sortable: true,
      flex: 2,
      cellRenderer: (params: any) => (
        <NumberCellRenderer
          value={params.value}
          prefix={t('common.currencySymbol')}
          decPlaces={moneyDecimalPlaces}
        />
      ),
    },
    {
      field: 'is_active',
      headerName: t('inventory.isActive') || 'Active',
      sortable: true,
      flex: 1,
      cellRenderer: (params: any) => (
        <YesNoCellRenderer value={params.value} />
      ),
    },
    {
      field: 'actions',
      headerName: t('common.actions') || 'Actions',
      sortable: false,
      filter: false,
      flex: 1,
      cellRenderer: (params: any) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleEdit(params.data)}
            className="p-1 rounded hover:bg-gray-100"
            title={t('common.edit') || 'Edit'}
            style={{ color: 'var(--color-primary-500)' }}
          >
            <FaEdit />
          </button>
          <button
            onClick={() => handleDelete(params.data)}
            className="p-1 rounded hover:bg-gray-100"
            title={t('common.delete') || 'Delete'}
            style={{ color: 'var(--color-danger-500)' }}
          >
            <FaTrash />
          </button>
        </div>
      ),
    },
  ]

  if (error) {
    return (
      <div className="p-3">
        <div className="text-red-600">
          {t('common.error')}: {error instanceof Error ? error.message : t('common.unknownError')}
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 pb-0">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {t('inventory.products') || 'Products'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            {t('inventory.description') || 'Manage products'}
          </p>
        </div>
        <Button onClick={handleCreate}>
          {t('inventory.createProduct') || 'Create Product'}
        </Button>
      </div>

      {/* <div className="mb-4 flex gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
          />
          <span style={{ color: 'var(--color-text-secondary)' }}>
            {t('stores.activeOnly') || 'Active only'}
          </span>
        </label>
      </div> */}

      <AdvancedDataGrid
        rowData={products}
        columnDefs={columns}
        loading={isLoading}
        emptyMessage={t('inventory.noProducts') || 'No products found'}
        height="550px"
      />
    </div>
  )
}


