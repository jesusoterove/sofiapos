/**
 * Store form component for creating and editing stores.
 */
import { useState, useEffect, FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { useTranslation } from '@/i18n/hooks'
import { storesApi, Store, StoreCreate, StoreUpdate } from '@/api/stores'
import { Button } from '@sofiapos/ui'

interface StoreFormProps {
  store?: Store | null
  onClose: () => void
}

export function StoreForm({ store, onClose }: StoreFormProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const isEditing = !!store

  const [formData, setFormData] = useState<StoreCreate>({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    default_tables_count: 10,
    requires_start_inventory: false,
    requires_end_inventory: false,
  })

  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name,
        code: store.code,
        address: store.address || '',
        phone: store.phone || '',
        email: store.email || '',
        default_tables_count: store.default_tables_count,
        requires_start_inventory: store.requires_start_inventory,
        requires_end_inventory: store.requires_end_inventory,
      })
    }
  }, [store])

  const createMutation = useMutation({
    mutationFn: (data: StoreCreate) => storesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] })
      toast.success(t('stores.createSuccess') || 'Store created successfully')
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('stores.createError') || 'Failed to create store')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: StoreUpdate }) => storesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] })
      toast.success(t('stores.updateSuccess') || 'Store updated successfully')
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('stores.updateError') || 'Failed to update store')
    },
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    
    if (isEditing && store) {
      updateMutation.mutate({ id: store.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b" style={{ borderColor: 'var(--color-border-default)' }}>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {isEditing ? t('stores.editStore') || 'Edit Store' : t('stores.createStore') || 'Create Store'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              {t('stores.name') || 'Name'} *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none"
              style={{
                borderColor: 'var(--color-border-default)',
                focusRingColor: 'var(--color-primary-500)',
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              {t('stores.code') || 'Code'} *
            </label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none"
              style={{ borderColor: 'var(--color-border-default)' }}
              disabled={isEditing}
            />
            {isEditing && (
              <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {t('stores.codeCannotChange') || 'Code cannot be changed'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              {t('stores.address') || 'Address'}
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none"
              style={{ borderColor: 'var(--color-border-default)' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                {t('stores.phone') || 'Phone'}
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none"
                style={{ borderColor: 'var(--color-border-default)' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                {t('stores.email') || 'Email'}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none"
                style={{ borderColor: 'var(--color-border-default)' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              {t('stores.defaultTablesCount') || 'Default Tables Count'}
            </label>
            <input
              type="number"
              min="0"
              value={formData.default_tables_count}
              onChange={(e) => setFormData({ ...formData, default_tables_count: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none"
              style={{ borderColor: 'var(--color-border-default)' }}
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.requires_start_inventory}
                onChange={(e) => setFormData({ ...formData, requires_start_inventory: e.target.checked })}
                className="rounded"
              />
              <span style={{ color: 'var(--color-text-primary)' }}>
                {t('stores.requiresStartInventory') || 'Require inventory count at shift start'}
              </span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.requires_end_inventory}
                onChange={(e) => setFormData({ ...formData, requires_end_inventory: e.target.checked })}
                className="rounded"
              />
              <span style={{ color: 'var(--color-text-primary)' }}>
                {t('stores.requiresEndInventory') || 'Require inventory count at shift end'}
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-border-default)' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading
                ? t('common.loading') || 'Loading...'
                : isEditing
                ? t('common.update') || 'Update'
                : t('common.create') || 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

