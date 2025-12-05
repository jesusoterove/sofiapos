/**
 * Products management page.
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { useTranslation } from '@/i18n/hooks'
import { productsApi, Product } from '@/api/products'
import { storesApi } from '@/api/stores'
import { Button, DataGrid, DataGridColumn, messageBox } from '@sofiapos/ui'
import { ProductForm } from '@/components/products/ProductForm'

export function Products() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [selectedStoreId, setSelectedStoreId] = useState<number | undefined>(undefined)
  const [activeOnly, setActiveOnly] = useState(false)

  // Fetch stores for filter
  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storesApi.list(false),
  })

  // Fetch products
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['products', selectedStoreId, activeOnly],
    queryFn: () => productsApi.list(0, 100, selectedStoreId, activeOnly),
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success(t('inventory.productCreateSuccess') || 'Product created successfully')
      setIsFormOpen(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('inventory.productCreateError') || 'Failed to create product')
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => productsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success(t('inventory.productUpdateSuccess') || 'Product updated successfully')
      setIsFormOpen(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('inventory.productUpdateError') || 'Failed to update product')
    },
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
    setEditingProduct(null)
    setIsFormOpen(true)
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setIsFormOpen(true)
  }

  const handleDelete = async (product: Product) => {
    const message = (t('common.deleteConfirmMessage') || 'Are you sure you want to delete "{{name}}"?').
      replace('{{name}}', product.name)
    const result = await messageBox.ask(message, undefined, 'YesNo')
    if (result.value === true) {
      deleteMutation.mutate(product.id)
    }
  }

  const handleSubmit = (data: any) => {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data })
    } else {
      createMutation.mutate(data)
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
      id: 'is_top_selling',
      headerName: t('inventory.isTopSelling') || 'Top Selling',
      field: 'is_top_selling',
      sortable: true,
      type: 'yesno',
    },
    {
      id: 'actions',
      headerName: t('common.actions') || 'Actions',
      cellRenderer: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(row)}
          >
            {t('common.edit')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(row)}
          >
            {t('common.delete')}
          </Button>
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
        <select
          value={selectedStoreId || ''}
          onChange={(e) => setSelectedStoreId(e.target.value ? Number(e.target.value) : undefined)}
          className="px-3 py-2 border rounded"
          style={{ borderColor: 'var(--color-border-default)' }}
        >
          <option value="">{t('common.allStores')}</option>
          {stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name}
            </option>
          ))}
        </select>
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
      />

      {isFormOpen && (
        <ProductForm
          product={editingProduct}
          stores={stores}
          onSubmit={handleSubmit}
          onCancel={() => setIsFormOpen(false)}
        />
      )}
    </div>
  )
}

