/**
 * User deletion confirmation dialog with password verification.
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from '@/i18n/hooks'
import { usersApi, User, UserTransactionInfo } from '@/api/users'
import { Button } from '@/components/ui/Button'

interface UserDeleteDialogProps {
  user: User
  onClose: () => void
  onConfirm: (password: string, force: boolean) => void
}

export function UserDeleteDialog({ user, onClose, onConfirm }: UserDeleteDialogProps) {
  const { t } = useTranslation()
  const [password, setPassword] = useState('')
  const [force, setForce] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Fetch transaction info
  const { data: transactionInfo, isLoading } = useQuery<UserTransactionInfo>({
    queryKey: ['user-transactions', user.id],
    queryFn: () => usersApi.getTransactionInfo(user.id),
  })

  const hasTransactions = transactionInfo?.has_transactions || false

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="p-6 border-b" style={{ borderColor: 'var(--color-border-default)' }}>
          <h2 className="text-2xl font-bold text-red-600">
            {t('users.deleteUser') || 'Delete User'}
          </h2>
        </div>

        <div className="p-6 space-y-4">
          <p style={{ color: 'var(--color-text-primary)' }}>
            {(t('users.deleteConfirm') || 'Are you sure you want to delete "{{name}}"?').replace('{{name}}', user.username)}
          </p>

          {isLoading ? (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: 'var(--color-primary-500)' }}></div>
            </div>
          ) : hasTransactions ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="font-semibold text-yellow-800 mb-2">
                {t('users.hasTransactions') || '⚠️ This user has associated data:'}
              </p>
              <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                {transactionInfo.orders_count > 0 && (
                  <li>{transactionInfo.orders_count} {t('users.orders') || 'orders'}</li>
                )}
                {transactionInfo.payments_count > 0 && (
                  <li>{transactionInfo.payments_count} {t('users.payments') || 'payments'}</li>
                )}
                {transactionInfo.shifts_count > 0 && (
                  <li>{transactionInfo.shifts_count} {t('users.shifts') || 'shifts'}</li>
                )}
              </ul>
              <p className="mt-3 text-sm text-yellow-700">
                {t('users.deleteWarning') || 'Deleting this user will permanently remove all associated data. This action cannot be undone.'}
              </p>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-700">
                {t('users.safeToDelete') || '✓ This user has no associated transactions and can be safely deleted.'}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              {t('users.confirmPassword') || 'Confirm Password'} *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none pr-10"
                style={{ borderColor: 'var(--color-border-default)' }}
                placeholder={t('users.enterPassword') || 'Enter your password'}
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

          {hasTransactions && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={force}
                onChange={(e) => setForce(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                {t('users.forceDelete') || 'Force physical deletion (all data will be permanently deleted)'}
              </span>
            </label>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-border-default)' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => onConfirm(password, force)}
              disabled={!password || (hasTransactions && !force)}
            >
              {hasTransactions && !force
                ? t('users.deactivate') || 'Deactivate'
                : t('users.delete') || 'Delete'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

