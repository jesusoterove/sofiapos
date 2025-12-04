/**
 * Form component for creating and editing products.
 */
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from '@/i18n/hooks'
import { Product } from '@/api/products'
import { Store } from '@/api/stores'
import { Button } from '@sofiapos/ui'

interface ProductFormProps {
  product: Product | null
  stores: Store[]
  onSubmit: (data: any) => void
  onCancel: () => void
}

export function ProductForm({ product, stores, onSubmit, onCancel }: ProductFormProps) {
  const { t } = useTranslation()
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      store_id: stores[0]?.id || '',
      name: '',
      code: '',
      description: '',
      selling_price: '0.00',
      requires_inventory: false,
      is_active: true,
      is_top_selling: false,
      allow_sell_without_inventory: false,
    },
  })

  useEffect(() => {
    if (product) {
      reset({
        store_id: product.store_id,
        name: product.name,
        code: product.code || '',
        description: product.description || '',
        selling_price: product.selling_price,
        requires_inventory: product.requires_inventory,
        is_active: product.is_active,
        is_top_selling: product.is_top_selling,
        allow_sell_without_inventory: product.allow_sell_without_inventory,
      })
    } else if (stores.length > 0) {
      reset({
        store_id: stores[0].id,
      })
    }
  }, [product, stores, reset])

  const handleFormSubmit = (data: any) => {
    onSubmit({
      ...data,
      store_id: Number(data.store_id),
      selling_price: data.selling_price.toString(),
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--color-bg-paper)' }}>
        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
          {product
            ? t('inventory.editProduct') || 'Edit Product'
            : t('inventory.createProduct') || 'Create Product'}
        </h2>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {!product && (
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                {t('stores.title') || 'Store'} *
              </label>
              <select
                {...register('store_id', { required: !product })}
                className="w-full px-3 py-2 border rounded"
                style={{ borderColor: 'var(--color-border-default)' }}
              >
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
              {errors.store_id && (
                <p className="text-red-500 text-xs mt-1">{t('common.storeRequired')}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
              {t('inventory.productName') || 'Name'} *
            </label>
            <input
              type="text"
              {...register('name', { required: true })}
              className="w-full px-3 py-2 border rounded"
              style={{ borderColor: 'var(--color-border-default)' }}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{t('common.nameRequired')}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
              {t('inventory.productCode') || 'Code'}
            </label>
            <input
              type="text"
              {...register('code')}
              className="w-full px-3 py-2 border rounded"
              style={{ borderColor: 'var(--color-border-default)' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
              {t('inventory.description') || 'Description'}
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border rounded"
              style={{ borderColor: 'var(--color-border-default)' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
              {t('inventory.sellingPrice') || 'Selling Price'} *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              {...register('selling_price', { required: true, min: 0 })}
              className="w-full px-3 py-2 border rounded"
              style={{ borderColor: 'var(--color-border-default)' }}
            />
            {errors.selling_price && (
              <p className="text-red-500 text-xs mt-1">{t('common.priceRequired')}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('requires_inventory')}
                className="rounded"
              />
              <span style={{ color: 'var(--color-text-primary)' }}>
                {t('inventory.requiresInventory') || 'Requires Inventory'}
              </span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('is_active')}
                className="rounded"
              />
              <span style={{ color: 'var(--color-text-primary)' }}>
                {t('inventory.isActive') || 'Active'}
              </span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('is_top_selling')}
                className="rounded"
              />
              <span style={{ color: 'var(--color-text-primary)' }}>
                {t('inventory.isTopSelling') || 'Top Selling'}
              </span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('allow_sell_without_inventory')}
                className="rounded"
              />
              <span style={{ color: 'var(--color-text-primary)' }}>
                {t('inventory.allowSellWithoutInventory') || 'Allow Sell Without Inventory'}
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">
              {product ? t('common.update') : t('common.create')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

