/**
 * Create user step component for registration wizard.
 */
import { useState } from 'react'
import { useTranslation } from '@/i18n/hooks'
import { Button, Input, Spinner } from '@sofiapos/ui'
import { FaArrowLeft, FaCheckCircle } from 'react-icons/fa'
import { toast } from 'react-toastify'
import apiClient from '@/api/client'

interface CreateUserStepProps {
  onNext: (userId: number, username: string) => void
  onBack: () => void
  onSkip: () => void
  cashRegisterId: number
  cashierName: string
  adminToken: string
}

export function CreateUserStep({
  onNext,
  onBack,
  onSkip,
  cashRegisterId,
  cashierName,
  adminToken,
}: CreateUserStepProps) {
  const { t } = useTranslation()
  const [userUsername, setUserUsername] = useState<string>('')
  const [userEmail, setUserEmail] = useState<string>('')
  const [userPassword, setUserPassword] = useState<string>('')
  const [userFullName, setUserFullName] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const handleCreateUser = async () => {
    if (!cashRegisterId) {
      toast.error(t('registration.cashRegisterNotFound') || 'Cash register not found')
      return
    }

    if (!userUsername.trim() || !userEmail.trim() || !userPassword.trim() || !userFullName.trim()) {
      toast.error(t('registration.fillAllFields') || 'Please fill all fields')
      return
    }

    setIsLoading(true)
    try {
      const userData = {
        cash_register_id: cashRegisterId,
        username: userUsername.trim(),
        email: userEmail.trim(),
        password: userPassword,
        full_name: userFullName.trim(),
      }

      const userResponse = await apiClient.post(`/api/v1/cash_registers/${cashRegisterId}/user`, userData, {
        headers: { Authorization: `Bearer ${adminToken}` },
        metadata: {
          skipAuthToken: true, // Skip default token handling, use custom Authorization header
          skipTokenRefresh: true, // Don't try to refresh token on 401
        },
      } as any)

      const cashierUser = userResponse.data

      toast.success(t('registration.userCreated') || 'User created successfully!')
      
      // Move to next step
      onNext(cashierUser.id, cashierUser.username)
    } catch (error: any) {
      console.error('User creation error:', error)
      toast.error(error.response?.data?.detail || error.message || (t('registration.userCreationError') || 'User creation failed'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-gradient p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-[var(--color-primary-500)] to-[var(--color-primary-600)] px-8 pt-12 pb-8 text-white">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={onBack}
                className="text-white opacity-90 hover:opacity-100 transition-opacity"
                disabled={isLoading}
              >
                <FaArrowLeft />
              </button>
              <span className="text-sm text-white opacity-90">
                {t('registration.step') || 'Step'} 5/6
              </span>
            </div>
            <h2 className="text-2xl font-bold">
              {t('registration.createUser') || 'Create Cashier User'}
            </h2>
            <p className="text-[var(--color-primary-100)] mt-2">
              {t('registration.createUserDescription') || 'Optionally create a user account with Cashier role for this terminal'}
            </p>
          </div>

          <div className="px-8 py-8 space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                {t('registration.createUserHint') || 'You can skip this step and create a user later if needed.'}
              </p>
            </div>

            <Input
              type="text"
              label={`${t('registration.username') || 'Username'} *`}
              value={userUsername}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserUsername(e.target.value)}
              disabled={isLoading}
              placeholder="cashier_user"
              fullWidth
              required
            />

            <Input
              type="email"
              label={`${t('registration.email') || 'Email'} *`}
              value={userEmail}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserEmail(e.target.value)}
              disabled={isLoading}
              placeholder="cashier@example.com"
              fullWidth
              required
            />

            <Input
              type="text"
              label={`${t('registration.fullName') || 'Full Name'} *`}
              value={userFullName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserFullName(e.target.value)}
              disabled={isLoading}
              placeholder={cashierName || (t('registration.cashier') || 'Cashier')}
              fullWidth
              required
            />

            <Input
              type="password"
              label={`${t('registration.password') || 'Password'} *`}
              value={userPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserPassword(e.target.value)}
              disabled={isLoading}
              placeholder="••••••••"
              fullWidth
              required
            />
            <p className="text-xs text-gray-500">
              {t('registration.passwordHint') || 'Minimum 6 characters'}
            </p>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={onBack}
                className="flex-1"
                disabled={isLoading}
              >
                <FaArrowLeft className="mr-2 inline" /> {t('common.back') || 'Back'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={onSkip}
                className="flex-1"
                disabled={isLoading}
              >
                {t('registration.skip') || 'Skip'}
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateUser}
                disabled={isLoading || !userUsername.trim() || !userEmail.trim() || !userPassword.trim() || !userFullName.trim()}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    {t('registration.creating') || 'Creating...'}
                  </>
                ) : (
                  <>
                    {t('registration.create') || 'Create'} <FaCheckCircle className="ml-2 inline" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

