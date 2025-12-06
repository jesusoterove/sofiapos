/**
 * Components Tab component for ProductForm.
 * Manages kit components for kit products.
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { useTranslation } from '@/i18n/hooks'
import { productsApi } from '@/api/products'
import { kitComponentsApi, KitComponent } from '@/api/kitComponents'
import { Button, messageBox, AdvancedDataGrid, AdvancedDataGridColumn, NumberCellRenderer } from '@sofiapos/ui'
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa'

interface ComponentsTabProps {
  productId: string | undefined
  isEditMode: boolean
  productType: string
}

export function ComponentsTab({ productId, isEditMode, productType }: ComponentsTabProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingComponent, setEditingComponent] = useState<KitComponent | null>(null)
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [quantity, setQuantity] = useState<string>('1')

  const { data: components = [], isLoading } = useQuery({
    queryKey: ['kit-components', productId],
    queryFn: () => kitComponentsApi.list(Number(productId)),
    enabled: isEditMode && !!productId && productType === 'kit',
  })

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.list(0, 1000),
  })

  const createMutation = useMutation({
    mutationFn: (data: { component_id: number; quantity: number }) => {
      return kitComponentsApi.create({
        product_id: Number(productId),
        component_id: data.component_id,
        quantity: data.quantity,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kit-components', productId] })
      setIsModalOpen(false)
      setSelectedProductId(null)
      setQuantity('1')
      toast.success(t('inventory.createSuccess') || 'Component added successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('inventory.createError') || 'Failed to add component')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { quantity: number } }) => {
      return kitComponentsApi.update(id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kit-components', productId] })
      setIsModalOpen(false)
      setEditingComponent(null)
      setSelectedProductId(null)
      setQuantity('1')
      toast.success(t('inventory.updateSuccess') || 'Component updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('inventory.updateError') || 'Failed to update component')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => kitComponentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kit-components', productId] })
      toast.success(t('inventory.deleteSuccess') || 'Component removed successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('inventory.deleteError') || 'Failed to remove component')
    },
  })

  const handleAdd = () => {
    setEditingComponent(null)
    setSelectedProductId(null)
    setQuantity('1')
    setIsModalOpen(true)
  }

  const handleEdit = (component: KitComponent) => {
    setEditingComponent(component)
    setSelectedProductId(component.component_id)
    setQuantity(String(component.quantity))
    setIsModalOpen(true)
  }

  const handleDelete = async (component: KitComponent) => {
    const message = (t('common.deleteConfirmMessage') || 'Are you sure you want to remove "{{name}}"?').replace('{{name}}', component.component_name || '')
    const result = await messageBox.ask(message, undefined, 'YesNo')
    if (result.value === true) {
      deleteMutation.mutate(component.id)
    }
  }

  const handleSubmit = () => {
    if (!selectedProductId || !quantity) {
      toast.error(t('common.required') || 'Please fill all required fields')
      return
    }

    if (editingComponent) {
      updateMutation.mutate({
        id: editingComponent.id,
        data: { quantity: parseFloat(quantity) },
      })
    } else {
      createMutation.mutate({
        component_id: selectedProductId,
        quantity: parseFloat(quantity),
      })
    }
  }

  const columns: AdvancedDataGridColumn<KitComponent>[] = [
    { field: 'component_code', headerName: t('inventory.productCode') || 'Code', sortable: true },
    { field: 'component_name', headerName: t('inventory.productName') || 'Name', sortable: true },
    {
      field: 'quantity',
      headerName: t('inventory.quantity') || 'Quantity',
      sortable: true,
      cellRenderer: (params: any) => (
        <NumberCellRenderer value={params.value} decPlaces={4} />
      ),
    },
    {
      field: 'actions',
      headerName: t('common.actions') || 'Actions',
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => (
        <div className="flex gap-1">
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

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button type="button" onClick={handleAdd} size="sm">
          <FaPlus className="mr-2" />
          {t('inventory.addComponent') || 'Add Component'}
        </Button>
      </div>
      <AdvancedDataGrid
        rowData={components}
        columnDefs={columns}
        loading={isLoading}
        emptyMessage={t('inventory.noProducts') || 'No components found'}
        height="400px"
      />
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md" style={{ backgroundColor: 'var(--color-bg-paper)' }}>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                {editingComponent ? t('common.edit') : t('inventory.addComponent')}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    {t('inventory.productName') || 'Product'} *
                  </label>
                  <select
                    value={selectedProductId || ''}
                    onChange={(e) => setSelectedProductId(Number(e.target.value))}
                    className="w-full px-4 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border-default)' }}
                    disabled={!!editingComponent}
                  >
                    <option value="">{t('common.select') || 'Select...'}</option>
                    {products.filter(p => p.id !== Number(productId)).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code ? `${p.code} - ` : ''}{p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    {t('inventory.quantity') || 'Quantity'} *
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border-default)' }}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6 justify-end">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="button" onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingComponent ? t('common.update') : t('common.create')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


