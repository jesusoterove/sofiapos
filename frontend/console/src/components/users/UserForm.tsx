/**
 * User form component for creating and editing users.
 */
import { useState, useEffect, FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { useTranslation } from '@/i18n/hooks'
import { usersApi, User, UserCreate, UserUpdate, Role } from '@/api/users'
import { storesApi, Store } from '@/api/stores'
import { Button } from '@/components/ui/Button'

interface UserFormProps {
  user?: User | null
  onClose: () => void
}

export function UserForm({ user, onClose }: UserFormProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const isEditing = !!user

  // Fetch roles and stores
  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => usersApi.listRoles(),
  })

  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storesApi.list(true), // Only active stores
  })

  const [formData, setFormData] = useState<UserCreate>({
    username: '',
    email: '',
    password: '',
    full_name: '',
    phone: '',
    store_id: undefined,
    is_active: true,
    is_superuser: false,
    role_ids: [],
  })

  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        password: '', // Don't populate password
        full_name: user.full_name || '',
        phone: user.phone || '',
        store_id: user.store_id,
        is_active: user.is_active,
        is_superuser: user.is_superuser,
        role_ids: user.role_ids,
      })
    }
  }, [user])

  const createMutation = useMutation({
    mutationFn: (data: UserCreate) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success(t('users.createSuccess') || 'User created successfully')
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('users.createError') || 'Failed to create user')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UserUpdate }) => usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success(t('users.updateSuccess') || 'User updated successfully')
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('users.updateError') || 'Failed to update user')
    },
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    
    if (isEditing && user) {
      const updateData: UserUpdate = { ...formData }
      // Only include password if it's been changed
      if (!updateData.password) {
        delete updateData.password
      }
      updateMutation.mutate({ id: user.id, data: updateData })
    } else {
      if (!formData.password) {
        toast.error(t('users.passwordRequired') || 'Password is required')
        return
      }
      createMutation.mutate(formData)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b" style={{ borderColor: 'var(--color-border-default)' }}>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {isEditing ? t('users.editUser') || 'Edit User' : t('users.createUser') || 'Create User'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                {t('users.username') || 'Username'} *
              </label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none"
                style={{ borderColor: 'var(--color-border-default)' }}
                disabled={isEditing}
              />
              {isEditing && (
                <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {t('users.usernameCannotChange') || 'Username cannot be changed'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                {t('users.email') || 'Email'} *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none"
                style={{ borderColor: 'var(--color-border-default)' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              {isEditing ? t('users.newPassword') || 'New Password (leave empty to keep current)' : t('users.password') || 'Password'} {!isEditing && '*'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required={!isEditing}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none pr-10"
                style={{ borderColor: 'var(--color-border-default)' }}
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                {t('users.fullName') || 'Full Name'}
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none"
                style={{ borderColor: 'var(--color-border-default)' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                {t('users.phone') || 'Phone'}
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none"
                style={{ borderColor: 'var(--color-border-default)' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              {t('users.store') || 'Store'}
            </label>
            <select
              value={formData.store_id || ''}
              onChange={(e) => setFormData({ ...formData, store_id: e.target.value ? parseInt(e.target.value) : undefined })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none"
              style={{ borderColor: 'var(--color-border-default)' }}
            >
              <option value="">{t('users.noStore') || 'No Store'}</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name} ({store.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              {t('users.roles') || 'Roles'}
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto border rounded-lg p-2" style={{ borderColor: 'var(--color-border-default)' }}>
              {roles.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  {t('users.noRolesAvailable') || 'No roles available'}
                </p>
              ) : (
                roles.map((role) => (
                  <label key={role.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.role_ids.includes(role.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, role_ids: [...formData.role_ids, role.id] })
                        } else {
                          setFormData({ ...formData, role_ids: formData.role_ids.filter(id => id !== role.id) })
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                      {role.name}
                      {role.description && (
                        <span className="ml-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          - {role.description}
                        </span>
                      )}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded"
              />
              <span style={{ color: 'var(--color-text-primary)' }}>
                {t('users.isActive') || 'Active'}
              </span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_superuser}
                onChange={(e) => setFormData({ ...formData, is_superuser: e.target.checked })}
                className="rounded"
              />
              <span style={{ color: 'var(--color-text-primary)' }}>
                {t('users.isSuperuser') || 'Superuser (Administrator)'}
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

