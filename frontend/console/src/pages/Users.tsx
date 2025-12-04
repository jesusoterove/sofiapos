/**
 * Users management page.
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { useTranslation } from '@/i18n/hooks'
import { usersApi, User } from '@/api/users'
import { UserForm } from '@/components/users/UserForm'
import { UserDeleteDialog } from '@/components/users/UserDeleteDialog'
import { Button } from '@/components/ui/Button'

export function Users() {
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

  // Log error for debugging
  if (error) {
    console.error('Error fetching users:', error)
  }

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
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
        </div>
      )}

      {/* Users Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--color-primary-500)' }}></div>
          <p className="mt-4" style={{ color: 'var(--color-text-secondary)' }}>
            {t('common.loading') || 'Loading...'}
          </p>
        </div>
      ) : !error && users.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p style={{ color: 'var(--color-text-secondary)' }}>
            {t('users.noUsers') || 'No users found'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y" style={{ borderColor: 'var(--color-border-default)' }}>
            <thead style={{ backgroundColor: 'var(--color-border-light)' }}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('users.username') || 'Username'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('users.fullName') || 'Full Name'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('users.email') || 'Email'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('users.roles') || 'Roles'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('users.status') || 'Status'}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                  {t('common.actions') || 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-border-default)' }}>
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {user.username}
                      {user.is_superuser && (
                        <span className="ml-2 px-2 py-0.5 text-xs rounded bg-purple-100 text-purple-800">
                          {t('users.superuser') || 'Admin'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {user.full_name || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {user.roles.length > 0 ? (
                        user.roles.map((role) => (
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
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {user.is_active
                        ? t('users.active') || 'Active'
                        : t('users.inactive') || 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {t('common.edit') || 'Edit'}
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
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

