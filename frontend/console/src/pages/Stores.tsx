/**
 * Stores management page.
 */
import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { useTranslation } from '@/i18n/hooks'
import { storesApi, Store } from '@/api/stores'
import { StoreForm } from '@/components/stores/StoreForm'
import { StoreDeleteDialog } from '@/components/stores/StoreDeleteDialog'
import { Button, DataGrid, DataGridColumn } from '@sofiapos/ui'

export function Stores() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingStore, setEditingStore] = useState<Store | null>(null)
  const [deleteStore, setDeleteStore] = useState<Store | null>(null)
  const [activeOnly, setActiveOnly] = useState(false)

  // Fetch stores
  const { data: stores = [], isLoading, error } = useQuery({
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

  // Define columns for DataGrid
  const columns = useMemo<DataGridColumn<Store>[]>(() => [
    {
      id: 'name',
      field: 'name',
      type: 'string',
      headerName: t('stores.name') || 'Name',
      sortable: true,
      filterable: true,
    },
    {
      id: 'code',
      field: 'code',
      type: 'string',
      headerName: t('stores.code') || 'Code',
      sortable: true,
      filterable: true,
    },
    {
      id: 'address',
      field: 'address',
      type: 'string',
      headerName: t('stores.address') || 'Address',
      sortable: true,
      filterable: true,
    },
    {
      id: 'phone',
      field: 'phone',
      type: 'string',
      headerName: t('stores.phone') || 'Phone',
      sortable: true,
      filterable: true,
    },
    {
      id: 'email',
      field: 'email',
      type: 'string',
      headerName: t('stores.email') || 'Email',
      sortable: true,
      filterable: true,
    },
    {
      id: 'is_active',
      field: 'is_active',
      headerName: t('stores.status') || 'Status',
      sortable: true,
      filterable: true,
      cellRenderer: ({ value }) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}
        >
          {value
            ? t('stores.active') || 'Active'
            : t('stores.inactive') || 'Inactive'}
        </span>
      ),
    },
    {
      id: 'actions',
      headerName: t('common.actions') || 'Actions',
      sortable: false,
      filterable: false,
      cellRenderer: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleEdit(row)
            }}
            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
          >
            {t('common.edit') || 'Edit'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDelete(row)
            }}
            className="text-red-600 hover:text-red-900 text-sm font-medium"
          >
            {t('common.delete') || 'Delete'}
          </button>
        </div>
      ),
    },
  ], [t])

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

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-semibold">Error loading stores</p>
          <p className="text-red-600 text-sm mt-1">
            {error instanceof Error ? error.message : t('common.unknownError')}
          </p>
        </div>
      )}

      {/* DataGrid */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <DataGrid
          data={stores}
          columns={columns}
          enableSorting
          enableFiltering
          enablePagination
          pageSize={10}
          loading={isLoading}
          emptyMessage={t('stores.noStores') || 'No stores found'}
          getRowClassName={(row) => (row.is_active ? '' : 'opacity-60')}
        />
      </div>

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
