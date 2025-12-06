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
import { Button, AdvancedDataGrid, AdvancedDataGridColumn } from '@sofiapos/ui'
import { FaEdit, FaTrash } from 'react-icons/fa'

export function StoreList() {
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

  // Define columns for AdvancedDataGrid
  const columns = useMemo<AdvancedDataGridColumn<Store>[]>(() => [
    {
      field: 'name',
      headerName: t('stores.name') || 'Name',
      sortable: true,
      filter: true,
      flex: 2,
    },
    {
      field: 'code',
      headerName: t('stores.code') || 'Code',
      sortable: true,
      filter: true,
      flex: 1,
    },
    {
      field: 'address',
      headerName: t('stores.address') || 'Address',
      sortable: true,
      filter: true,
      flex: 2,
    },
    {
      field: 'phone',
      headerName: t('stores.phone') || 'Phone',
      sortable: true,
      filter: true,
      flex: 2,
    },
    {
      field: 'email',
      headerName: t('stores.email') || 'Email',
      sortable: true,
      filter: true,
    },
    {
      field: 'is_active',
      headerName: t('stores.status') || 'Status',
      sortable: true,
      filter: true,
      flex: 1,
      cellRenderer: (params: any) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            params.value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}
        >
          {params.value
            ? t('stores.active') || 'Active'
            : t('stores.inactive') || 'Inactive'}
        </span>
      ),
    },
    {
      field: 'actions',
      headerName: t('common.actions') || 'Actions',
      sortable: false,
      filter: false,
      flex: 1,
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
  ], [t])

  return (
    <div className="space-y-6 pb-0">
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
      {/* <div className="flex items-center gap-4">
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
      </div> */}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-semibold">Error loading stores</p>
          <p className="text-red-600 text-sm mt-1">
            {error instanceof Error ? error.message : t('common.unknownError')}
          </p>
        </div>
      )}

      {/* AdvancedDataGrid */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <AdvancedDataGrid
          rowData={stores}
          columnDefs={columns}
          enableSorting
          enableFiltering
          enablePagination
          paginationPageSize={10}
          loading={isLoading}
          emptyMessage={t('stores.noStores') || 'No stores found'}
          getRowClassName={(params: any) => (params.data.is_active ? '' : 'opacity-60')}
          height="550px"
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


