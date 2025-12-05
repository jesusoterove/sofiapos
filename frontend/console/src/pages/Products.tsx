/**
 * Products management page.
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'react-toastify'
import { useTranslation } from '@/i18n/hooks'
import { productsApi, Product } from '@/api/products'
import { Button, DataGrid, DataGridColumn, messageBox } from '@sofiapos/ui'
import { FaEdit, FaTrash } from 'react-icons/fa'

export function Products() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
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
    const message = (t('common.deleteConfirmMessage') || 'Are you sure you want to delete "{{name}}"?').
      replace('{{name}}', product.name)
    const result = await messageBox.ask(message, undefined, 'YesNo')
    if (result.value === true) {
      deleteMutation.mutate(product.id)
    }
  }

  const columns: DataGridColumn<Product>[] = [
    {
      id: 'name',
      headerName: t('inventory.productName') || 'Name',
      field: 'name',
      sortable: true,
      filterable: true,
      // TextCellRenderer will be used automatically
    },
    {
      id: 'code',
      headerName: t('inventory.productCode') || 'Code',
      field: 'code',
      sortable: true,
      filterable: true,
      // TextCellRenderer will be used automatically
    },
    {
      id: 'product_type',
      headerName: t('inventory.productType') || 'Type',
      field: 'product_type',
      sortable: true,
      filterable: true,
      type: 'string',
    },
    {
      id: 'selling_price',
      headerName: t('inventory.sellingPrice') || 'Selling Price',
      field: 'selling_price',
      sortable: true,
      type: 'money',
      cellRendererOptions: {
        prefix: t('common.currencySymbol'),
        decPlaces: 2,
      },
    },
    {
      id: 'is_active',
      headerName: t('inventory.isActive') || 'Active',
      field: 'is_active',
      sortable: true,
      type: 'yesno',
    },
    {
      id: 'actions',
      headerName: t('common.actions') || 'Actions',
      cellRenderer: ({ row }) => (
        <div className="flex gap-1">
          <button
            onClick={() => handleEdit(row)}
            className="p-1 rounded hover:bg-gray-100"
            title={t('common.edit') || 'Edit'}
            style={{ color: 'var(--color-primary-500)' }}
          >
            <FaEdit />
          </button>
          <button
            onClick={() => handleDelete(row)}
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
      <div className="p-6">
        <div className="text-red-600">
          {t('common.error')}: {error instanceof Error ? error.message : t('common.unknownError')}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
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

      <div className="mb-4 flex gap-4">
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
      </div>

      <DataGrid
        data={products}
        columns={columns}
        loading={isLoading}
        emptyMessage={t('inventory.noProducts') || 'No products found'}
        compact={true}
      />
    </div>
  )
}

