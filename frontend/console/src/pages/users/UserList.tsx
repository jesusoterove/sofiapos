/**
 * Users management page.
 */
import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { useTranslation } from '@/i18n/hooks'
import { usersApi, User } from '@/api/users'
import { UserForm } from '@/components/users/UserForm'
import { UserDeleteDialog } from '@/components/users/UserDeleteDialog'
import { Button, DataGrid, DataGridColumn } from '@sofiapos/ui'

export function UserList() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deleteUser, setDeleteUser] = useState<User | null>(null)
  const [activeOnly, setActiveOnly] = useState(false)

  // Fetch users
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users', activeOnly],
    queryFn: () => usersApi.list(activeOnly),
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: ({ id, password, force }: { id: number; password: string; force: boolean }) =>
      usersApi.delete(id, password, force),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success(t('users.deleteSuccess') || 'User deleted successfully')
      setDeleteUser(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('users.deleteError') || 'Failed to delete user')
    },
  })

  const handleCreate = () => {
    setEditingUser(null)
    setIsFormOpen(true)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setIsFormOpen(true)
  }

  const handleDelete = (user: User) => {
    setDeleteUser(user)
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingUser(null)
  }

  // Define columns for DataGrid
  const columns = useMemo<DataGridColumn<User>[]>(() => [
    {
      id: 'username',
      field: 'username',
      headerName: t('users.username') || 'Username',
      sortable: true,
      filterable: true,
      cellRenderer: ({ value, row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {value}
          </span>
          {row.is_superuser && (
            <span className="px-2 py-0.5 text-xs rounded bg-purple-100 text-purple-800">
              {t('users.superuser') || 'Admin'}
            </span>
          )}
        </div>
      ),
    },
    {
      id: 'full_name',
      field: 'full_name',
      headerName: t('users.fullName') || 'Full Name',
      sortable: true,
      filterable: true,
      cellRenderer: ({ value }) => (
        <span style={{ color: 'var(--color-text-secondary)' }}>
          {value || '-'}
        </span>
      ),
    },
    {
      id: 'email',
      field: 'email',
      headerName: t('users.email') || 'Email',
      sortable: true,
      filterable: true,
      cellRenderer: ({ value }) => (
        <span style={{ color: 'var(--color-text-secondary)' }}>
          {value}
        </span>
      ),
    },
    {
      id: 'roles',
      headerName: t('users.roles') || 'Roles',
      sortable: false,
      filterable: false,
      cellRenderer: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.roles.length > 0 ? (
            row.roles.map((role) => (
              <span
                key={role.id}
                className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800"
              >
                {role.name}
              </span>
            ))
          ) : (
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {t('users.noRoles') || 'No roles'}
            </span>
          )}
        </div>
      ),
    },
    {
      id: 'is_active',
      field: 'is_active',
      headerName: t('users.status') || 'Status',
      sortable: true,
      filterable: true,
      cellRenderer: ({ value }) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}
        >
          {value
            ? t('users.active') || 'Active'
            : t('users.inactive') || 'Inactive'}
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
            {t('users.title') || 'Users'}
          </h1>
          <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
            {t('users.description') || 'Manage system users and permissions'}
          </p>
        </div>
        <Button onClick={handleCreate}>
          {t('users.create') || 'Create User'}
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
            {t('users.activeOnly') || 'Active only'}
          </span>
        </label>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-semibold">Error loading users</p>
          <p className="text-red-600 text-sm mt-1">
            {error instanceof Error ? error.message : t('common.unknownError')}
          </p>
        </div>
      )}

      {/* DataGrid */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <DataGrid
          data={users}
          columns={columns}
          enableSorting
          enableFiltering
          enablePagination
          pageSize={10}
          loading={isLoading}
          emptyMessage={t('users.noUsers') || 'No users found'}
          getRowClassName={(row) => (row.is_active ? '' : 'opacity-60')}
        />
      </div>

      {/* User Form Modal */}
      {isFormOpen && (
        <UserForm
          user={editingUser}
          onClose={handleFormClose}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteUser && (
        <UserDeleteDialog
          user={deleteUser}
          onClose={() => setDeleteUser(null)}
          onConfirm={(password, force) => {
            deleteMutation.mutate({ id: deleteUser.id, password, force })
          }}
        />
      )}
    </div>
  )
}


