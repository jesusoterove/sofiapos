/**
 * Store create/edit page.
 */
import { useEffect } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { useTranslation } from '@/i18n/hooks'
import { storesApi, StoreCreate, StoreUpdate } from '@/api/stores'
import { Button, messageBox } from '@sofiapos/ui'

export function StoreForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const params = useParams({ strict: false })
  const storeId = params.storeId
  const queryClient = useQueryClient()
  const isEditMode = !!storeId && storeId !== 'new'

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
  } = useForm<StoreCreate & StoreUpdate>({
    defaultValues: {
      name: '',
      code: '',
      address: '',
      phone: '',
      email: '',
      default_tables_count: 10,
      requires_start_inventory: false,
      requires_end_inventory: false,
      is_active: true,
    },
  })

  const storeName = watch('name')

  // Fetch store if editing
  const { data: store, isLoading: isLoadingStore } = useQuery({
    queryKey: ['stores', storeId],
    queryFn: () => storesApi.get(Number(storeId)),
    enabled: isEditMode && !!storeId,
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: StoreCreate) => storesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] })
      toast.success(t('stores.createSuccess') || 'Store created successfully')
      navigate({ to: '/stores' })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('stores.createError') || 'Failed to create store')
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: StoreUpdate }) => storesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] })
      toast.success(t('stores.updateSuccess') || 'Store updated successfully')
      navigate({ to: '/stores' })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('stores.updateError') || 'Failed to update store')
    },
  })

  // Load store data when editing
  useEffect(() => {
    if (store) {
      reset({
        name: store.name,
        code: store.code,
        address: store.address || '',
        phone: store.phone || '',
        email: store.email || '',
        default_tables_count: store.default_tables_count,
        requires_start_inventory: store.requires_start_inventory,
        requires_end_inventory: store.requires_end_inventory,
        is_active: store.is_active,
      })
    }
  }, [store, reset])

  const onSubmit = (data: any) => {
    if (isEditMode && storeId) {
      // Create update payload - code cannot be updated
      const updateData: StoreUpdate = {
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        default_tables_count: Number(data.default_tables_count),
        requires_start_inventory: data.requires_start_inventory,
        requires_end_inventory: data.requires_end_inventory,
        is_active: data.is_active,
      }
      updateMutation.mutate({ id: Number(storeId), data: updateData })
    } else {
      // Don't send code when creating - backend will auto-generate it
      const createData: StoreCreate = {
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        default_tables_count: Number(data.default_tables_count),
        requires_start_inventory: data.requires_start_inventory,
        requires_end_inventory: data.requires_end_inventory,
      }
      createMutation.mutate(createData)
    }
  }

  const handleCancel = async () => {
    if (isDirty) {
      const message = t('common.cancelConfirm') || 'You have unsaved changes. Are you sure you want to cancel?'
      const result = await messageBox.ask(message, undefined, 'YesNo')
      if (result.value === true) {
        navigate({ to: '/stores' })
      }
    } else {
      navigate({ to: '/stores' })
    }
  }

  if (isEditMode && isLoadingStore) {
    return (
      <div className="p-3">
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

  return (
    <div className="p-3">
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
            placeholder={t('stores.storeName') || 'Store Name'}
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{t('common.nameRequired') || 'Name is required'}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" onClick={handleCancel} variant="secondary">
            {t('common.cancel')}
          </Button>
          <Button 
            type="submit" 
            form="store-form"
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
          <form id="store-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-left" style={{ color: 'var(--color-text-primary)' }}>
                    {t('stores.code') || 'Code'}
                  </label>
                  <input
                    type="text"
                    {...register('code')}
                    disabled={true}
                    value={isEditMode ? (store?.code || '') : (storeName ? `${storeName[0]?.toUpperCase() || 'S'}XX` : '')}
                    className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-100 disabled:text-gray-500"
                    style={{ borderColor: 'var(--color-border-default)' }}
                  />
                  {!isEditMode && (
                    <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {t('stores.codeAutoGenerated') || 'Code will be auto-generated from store name'}
                    </p>
                  )}
                  {isEditMode && (
                    <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {t('stores.codeCannotChange') || 'Code cannot be changed'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-left" style={{ color: 'var(--color-text-primary)' }}>
                    {t('stores.phone') || 'Phone'}
                  </label>
                  <input
                    type="tel"
                    {...register('phone')}
                    className="w-full px-4 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border-default)' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-left" style={{ color: 'var(--color-text-primary)' }}>
                    {t('stores.email') || 'Email'}
                  </label>
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full px-4 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border-default)' }}
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-left" style={{ color: 'var(--color-text-primary)' }}>
                    {t('stores.address') || 'Address'}
                  </label>
                  <textarea
                    {...register('address')}
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border-default)' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-left" style={{ color: 'var(--color-text-primary)' }}>
                    {t('stores.defaultTablesCount') || 'Default Tables Count'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    {...register('default_tables_count', { required: true })}
                    className="w-full px-4 py-2 border rounded-lg"
                    style={{ borderColor: 'var(--color-border-default)' }}
                  />
                </div>

                <div className="space-y-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('requires_start_inventory')}
                      className="rounded w-4 h-4"
                    />
                    <span style={{ color: 'var(--color-text-primary)' }}>
                      {t('stores.requiresStartInventory') || 'Require inventory count at shift start'}
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('requires_end_inventory')}
                      className="rounded w-4 h-4"
                    />
                    <span style={{ color: 'var(--color-text-primary)' }}>
                      {t('stores.requiresEndInventory') || 'Require inventory count at shift end'}
                    </span>
                  </label>

                  {isEditMode && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('is_active')}
                        className="rounded w-4 h-4"
                      />
                      <span style={{ color: 'var(--color-text-primary)' }}>
                        {t('stores.isActive') || 'Active'}
                      </span>
                    </label>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
