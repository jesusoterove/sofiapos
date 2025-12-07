/**
 * Credential dialog for re-authentication when refresh token fails.
 */
import React, { useState } from 'react'
import { Modal } from '@sofiapos/ui'
import { Input, Button } from '@sofiapos/ui'
import { useTranslation } from '@/i18n/hooks'
import { useAuth } from '@/contexts/AuthContext'

interface CredentialDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  message?: string
}

export function CredentialDialog({ isOpen, onClose, onSuccess, message }: CredentialDialogProps) {
  const { t } = useTranslation()
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await login(username, password)
      setUsername('')
      setPassword('')
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : (t('auth.loginError') || 'Login failed'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setUsername('')
      setPassword('')
      setError(null)
      onClose()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('sync.reauthRequired') || 'Re-authentication Required'}
      size="sm"
    >
      <div className="space-y-4">
        {message && (
          <p className="text-sm" style={{ color: 'var(--color-text-secondary, #6B7280)' }}>
            {message}
          </p>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('auth.username') || 'Username'}
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={isLoading}
            autoFocus
          />
          
          <Input
            label={t('auth.password') || 'Password'}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
          
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isLoading}
            >
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading || !username || !password}
            >
              {isLoading ? (t('common.loading') || 'Loading...') : (t('auth.login') || 'Login')}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

