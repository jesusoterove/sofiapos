/**
 * Stores management page.
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { useTranslation } from '@/i18n/hooks'
import { storesApi, Store } from '@/api/stores'
import { StoreForm } from '@/components/stores/StoreForm'
import { StoreDeleteDialog } from '@/components/stores/StoreDeleteDialog'
import { Button } from '@/components/ui/Button'

export function Stores() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingStore, setEditingStore] = useState<Store | null>(null)
  const [deleteStore, setDeleteStore] = useState<Store | null>(null)
  const [activeOnly, setActiveOnly] = useState(false)

  // Fetch stores
  const { data: stores = [], isLoading } = useQuery({
    queryKey: ['stores', activeOnly],
    queryFn: () => storesApi.list(activeOnly),
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: ({ id, password, force }: { id: number; password: string; force: boolean }) =>
      storesApi.delete(id, password, force),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] })
      toast.success(t('stores.deleteSuccess') || 'Store deleted successfully')
      setDeleteStore(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('stores.deleteError') || 'Failed to delete store')
    },
  })

  const handleCreate = () => {
    setEditingStore(null)
    setIsFormOpen(true)
  }

  const handleEdit = (store: Store) => {
    setEditingStore(store)
    setIsFormOpen(true)
  }

  const handleDelete = (store: Store) => {
    setDeleteStore(store)
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingStore(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {t('stores.title') || 'Stores'}
          </h1>
          <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
            {t('stores.description') || 'Manage store locations and settings'}
          </p>
        </div>
        <Button onClick={handleCreate}>
          {t('stores.create') || 'Create Store'}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
            className="rounded"
          />
          <span style={{ color: 'var(--color-text-secondary)' }}>
            {t('stores.activeOnly') || 'Active only'}
          </span>
        </label>
      </div>

      {/* Stores Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--color-primary-500)' }}></div>
          <p className="mt-4" style={{ color: 'var(--color-text-secondary)' }}>
            {t('common.loading') || 'Loading...'}
          </p>
        </div>
      ) : stores.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p style={{ color: 'var(--color-text-secondary)' }}>
            {t('stores.noStores') || 'No stores found'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y" style={{ borderColor: 'var(--color-border-default)' }}>
            <thead style={{ backgroundColor: 'var(--color-border-light)' }}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('stores.name') || 'Name'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('stores.code') || 'Code'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('stores.email') || 'Email'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('stores.status') || 'Status'}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('common.actions') || 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-border-default)' }}>
              {stores.map((store) => (
                <tr key={store.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {store.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {store.code}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {store.email || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        store.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {store.is_active
                        ? t('stores.active') || 'Active'
                        : t('stores.inactive') || 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(store)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {t('common.edit') || 'Edit'}
                      </button>
                      <button
                        onClick={() => handleDelete(store)}
                        className="text-red-600 hover:text-red-900"
                      >
                        {t('common.delete') || 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Store Form Modal */}
      {isFormOpen && (
        <StoreForm
          store={editingStore}
          onClose={handleFormClose}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteStore && (
        <StoreDeleteDialog
          store={deleteStore}
          onClose={() => setDeleteStore(null)}
          onConfirm={(password, force) => {
            deleteMutation.mutate({ id: deleteStore.id, password, force })
          }}
        />
      )}
    </div>
  )
}

