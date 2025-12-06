/**
 * Prices Tab component for ProductForm.
 * Manages store-specific product prices.
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { useTranslation } from '@/i18n/hooks'
import { storesApi } from '@/api/stores'
import { storeProductPricesApi, StoreProductPrice } from '@/api/storeProductPrices'
import { Button, messageBox, AdvancedDataGrid, AdvancedDataGridColumn, NumberCellRenderer } from '@sofiapos/ui'
import { useSettings } from '@/contexts/SettingsContext'
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa'

interface PricesTabProps {
  productId: string | undefined
  isEditMode: boolean
  defaultPrice: string
}

export function PricesTab({ productId, isEditMode, defaultPrice }: PricesTabProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { moneyDecimalPlaces } = useSettings()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPrice, setEditingPrice] = useState<StoreProductPrice | null>(null)
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null)
  const [price, setPrice] = useState<string>('')

  const { data: storePrices = [], isLoading } = useQuery({
    queryKey: ['store-prices', productId],
    queryFn: () => storeProductPricesApi.list(Number(productId)),
    enabled: isEditMode && !!productId,
  })

  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storesApi.list(false),
  })

  const createMutation = useMutation({
    mutationFn: (data: { store_id: number; selling_price: number }) => {
      return storeProductPricesApi.create({
        store_id: data.store_id,
        product_id: Number(productId),
        selling_price: data.selling_price,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-prices', productId] })
      setIsModalOpen(false)
      setSelectedStoreId(null)
      setPrice('')
      toast.success(t('inventory.createSuccess') || 'Price added successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('inventory.createError') || 'Failed to add price')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { selling_price: number } }) => {
      return storeProductPricesApi.update(id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-prices', productId] })
      setIsModalOpen(false)
      setEditingPrice(null)
      setSelectedStoreId(null)
      setPrice('')
      toast.success(t('inventory.updateSuccess') || 'Price updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('inventory.updateError') || 'Failed to update price')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => storeProductPricesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-prices', productId] })
      toast.success(t('inventory.deleteSuccess') || 'Price removed successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('inventory.deleteError') || 'Failed to remove price')
    },
  })

  const handleAdd = () => {
    setEditingPrice(null)
    setSelectedStoreId(null)
    setPrice('')
    setIsModalOpen(true)
  }

  const handleEdit = (storePrice: StoreProductPrice) => {
    setEditingPrice(storePrice)
    setSelectedStoreId(storePrice.store_id)
    setPrice(String(storePrice.selling_price))
    setIsModalOpen(true)
  }

  const handleDelete = async (storePrice: StoreProductPrice) => {
    const message = (t('common.deleteConfirmMessage') || 'Are you sure you want to delete price for "{{name}}"?').replace('{{name}}', storePrice.store_name || '')
    const result = await messageBox.ask(message, undefined, 'YesNo')
    if (result.value === true) {
      deleteMutation.mutate(storePrice.id)
    }
  }

  const handleSubmit = () => {
    if (!selectedStoreId || !price) {
      toast.error(t('common.required') || 'Please fill all required fields')
      return
    }

    if (editingPrice) {
      updateMutation.mutate({
        id: editingPrice.id,
        data: { selling_price: parseFloat(price) },
      })
    } else {
      createMutation.mutate({
        store_id: selectedStoreId,
        selling_price: parseFloat(price),
      })
    }
  }

  const columns: AdvancedDataGridColumn<StoreProductPrice>[] = [
    { field: 'store_name', headerName: t('stores.store') || 'Store', sortable: true, flex: 1 },
    {
      field: 'selling_price',
      headerName: t('inventory.sellingPrice') || 'Selling Price',
      sortable: true,
      width: 200,
      cellRenderer: (params: any) => (
        <NumberCellRenderer
          value={params.value}
          prefix={t('common.currencySymbol')}
          decPlaces={moneyDecimalPlaces}
        />
      ),
    },
    {
      field: 'actions',
      headerName: t('common.actions') || 'Actions',
      sortable: false,
      filter: false,
      width: 100,
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

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            {t('inventory.defaultPrice') || 'Default Price'}
          </label>
          <div className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {t('common.currencySymbol')}{defaultPrice || '0.00'}
          </div>
        </div>
        <Button type="button" onClick={handleAdd} size="sm">
          <FaPlus className="mr-2" />
          {t('inventory.addPrice') || 'Add Price'}
        </Button>
      </div>
      <AdvancedDataGrid
        rowData={storePrices}
        columnDefs={columns}
        loading={isLoading}
        emptyMessage={t('inventory.noProducts') || 'No store prices found'}
        height="400px"
      />
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md" style={{ backgroundColor: 'var(--color-bg-paper)' }}>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                {editingPrice ? t('common.edit') : t('inventory.addPrice')}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    {t('stores.store') || 'Store'} *
                  </label>
                  <select
                    value={selectedStoreId || ''}
                    onChange={(e) => setSelectedStoreId(Number(e.target.value))}
                    className="w-full px-4 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border-default)' }}
                    disabled={!!editingPrice}
                  >
                    <option value="">{t('common.select') || 'Select...'}</option>
                    {stores.filter(s => !storePrices.some(sp => sp.store_id === s.id && sp.id !== editingPrice?.id)).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    {t('inventory.sellingPrice') || 'Selling Price'} *
                  </label>
                  <input
                    type="number"
                    step={1 / Math.pow(10, moneyDecimalPlaces)}
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border-default)' }}
                    placeholder={`0.${'0'.repeat(moneyDecimalPlaces)}`}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6 justify-end">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="button" onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingPrice ? t('common.update') : t('common.create')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


