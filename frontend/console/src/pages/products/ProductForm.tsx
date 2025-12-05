/**
 * Product create/edit page with tabbed sections.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { useTranslation } from '@/i18n/hooks'
import { productsApi, ProductType } from '@/api/products'
import { Button, messageBox, Tabs, Tab } from '@sofiapos/ui'
import { useSettings } from '@/contexts/SettingsContext'
import { IngredientsTab, ComponentsTab, GroupsTab, PricesTab } from './components'

export function ProductForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const params = useParams({ strict: false })
  const productId = params.productId
  const queryClient = useQueryClient()
  const isEditMode = !!productId && productId !== 'new'
  const { moneyDecimalPlaces } = useSettings()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
    reset,
  } = useForm({
    defaultValues: {
      name: '',
      code: '',
      description: '',
      category_id: null as number | null,
      product_type: 'sales_inventory' as ProductType,
      is_active: true,
      selling_price: '',
    },
  })

  const productType = watch('product_type')

  // Fetch product if editing
  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['products', productId],
    queryFn: () => productsApi.get(Number(productId)),
    enabled: isEditMode && !!productId,
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success(t('inventory.createSuccess') || 'Product created successfully')
      navigate({ to: '/inventory/products' })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('inventory.createError') || 'Failed to create product')
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => productsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success(t('inventory.updateSuccess') || 'Product updated successfully')
      navigate({ to: '/inventory/products' })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('inventory.updateError') || 'Failed to update product')
    },
  })

  // Load product data when editing
  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        code: product.code || '',
        description: product.description || '',
        category_id: product.category_id || null,
        product_type: product.product_type,
        is_active: product.is_active,
        selling_price: product.selling_price !== null && product.selling_price !== undefined ? String(product.selling_price) : '',
      })
    }
  }, [product, reset])

  const onSubmit = (data: any) => {
    if (isEditMode && productId) {
      updateMutation.mutate({ id: Number(productId), data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleCancel = async () => {
    if (isDirty) {
      const message = t('common.cancelConfirm') || 'You have unsaved changes. Are you sure you want to cancel?'
      const result = await messageBox.ask(message, undefined, 'YesNo')
      if (result.value === true) {
        navigate({ to: '/inventory/products' })
      }
    } else {
      navigate({ to: '/inventory/products' })
    }
  }

  if (isEditMode && isLoadingProduct) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--color-primary-500)' }}></div>
            <p className="mt-4" style={{ color: 'var(--color-text-secondary)' }}>
              {t('common.loading')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const defaultPrice = watch('selling_price')

  const tabs: Tab[] = [
    {
      id: 'general',
      label: t('inventory.general') || 'General',
      content: (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-left" style={{ color: 'var(--color-text-primary)' }}>
              {t('inventory.productCode') || 'Code'}
            </label>
            <input
              type="text"
              {...register('code')}
              className="w-full px-4 py-2 border rounded-lg"
              style={{ borderColor: 'var(--color-border-default)' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-left" style={{ color: 'var(--color-text-primary)' }}>
              {t('inventory.description') || 'Description'}
            </label>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full px-4 py-2 border rounded-lg"
              style={{ borderColor: 'var(--color-border-default)' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-left" style={{ color: 'var(--color-text-primary)' }}>
                {t('inventory.productType') || 'Product Type'} *
              </label>
              <select
                {...register('product_type', { required: true })}
                className="w-full px-4 py-2 border rounded-lg"
                style={{ borderColor: 'var(--color-border-default)' }}
              >
                <option value="sales_inventory">{t('inventory.productTypeSalesInventory') || 'Sales Inventory'}</option>
                <option value="prepared">{t('inventory.productTypePrepared') || 'Prepared'}</option>
                <option value="kit">{t('inventory.productTypeKit') || 'Kit'}</option>
                <option value="service">{t('inventory.productTypeService') || 'Service'}</option>
                <option value="misc_charges">{t('inventory.productTypeMiscCharges') || 'Misc Charges'}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-left" style={{ color: 'var(--color-text-primary)' }}>
                {t('inventory.sellingPrice') || 'Selling Price'} *
              </label>
              <input
                type="number"
                step={1 / Math.pow(10, moneyDecimalPlaces)}
                min="0"
                {...register('selling_price', {
                  required: true,
                  setValueAs: (v) => v === '' ? null : v
                })}
                className="w-full px-4 py-2 border rounded-lg"
                style={{ borderColor: 'var(--color-border-default)' }}
                placeholder={`0.${'0'.repeat(moneyDecimalPlaces)}`}
              />
              {errors.selling_price && (
                <p className="text-red-500 text-xs mt-1">{t('common.required') || 'Required'}</p>
              )}
            </div>
          </div>

          <div>
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
          </div>
        </div>
      ),
    },
  ]

  // Add ingredients tab only for prepared products in edit mode
  if (isEditMode && productType === 'prepared') {
    tabs.push({
      id: 'ingredients',
      label: t('inventory.ingredients') || 'Ingredients',
      content: <IngredientsTab productId={productId} isEditMode={isEditMode} productType={productType} />,
    })
  }

  // Add components tab only for kit products in edit mode
  if (isEditMode && productType === 'kit') {
    tabs.push({
      id: 'components',
      label: t('inventory.components') || 'Components',
      content: <ComponentsTab productId={productId} isEditMode={isEditMode} productType={productType} />,
    })
  }

  // Add groups tab only in edit mode
  if (isEditMode) {
    tabs.push({
      id: 'groups',
      label: t('inventory.groups') || 'Groups',
      content: <GroupsTab productId={productId} isEditMode={isEditMode} />,
    })
  }

  // Add prices tab only in edit mode
  if (isEditMode) {
    tabs.push({
      id: 'prices',
      label: t('inventory.prices') || 'Prices',
      content: <PricesTab productId={productId} isEditMode={isEditMode} defaultPrice={defaultPrice || ''} />,
    })
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1">
          <input
            type="text"
            {...register('name', { required: true })}
            className="text-2xl font-bold w-full px-2 py-1 border-b-2 bg-transparent"
            style={{ 
              color: 'var(--color-text-primary)',
              borderColor: 'var(--color-border-default)'
            }}
            placeholder={t('inventory.productName') || 'Product Name'}
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{t('common.nameRequired')}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" onClick={handleCancel}>
            {t('common.cancel')}
          </Button>
          <Button 
            type="submit" 
            form="product-form"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending
              ? t('common.loading')
              : isEditMode
              ? t('common.update')
              : t('common.create')}
          </Button>
        </div>
      </div>

      <div className="max-w-4xl">
        <div className="bg-white rounded-lg p-6 shadow-sm" style={{ backgroundColor: 'var(--color-bg-paper)' }}>
          <form id="product-form" onSubmit={handleSubmit(onSubmit)}>
            <Tabs tabs={tabs} defaultTab="general" />
          </form>
        </div>
      </div>
    </div>
  )
}
