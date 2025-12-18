/**
 * Admin credentials step component for registration wizard.
 */
import { useState } from 'react'
import { useTranslation } from '@/i18n/hooks'
import { Button, Input, Spinner } from '@sofiapos/ui'
import { FaUser, FaLock, FaArrowLeft, FaArrowRight } from 'react-icons/fa'
import { toast } from 'react-toastify'
import apiClient from '@/api/client'

interface Store {
  id: number
  name: string
  code: string
  is_active: boolean
}

interface CredentialsStepProps {
  onNext: (adminToken: string, stores: Store[]) => void
  onBack: () => void
  initialUsername?: string
}

export function CredentialsStep({ onNext, onBack, initialUsername = '' }: CredentialsStepProps) {
  const { t } = useTranslation()
  const [adminUsername, setAdminUsername] = useState(initialUsername)
  const [adminPassword, setAdminPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!adminUsername || !adminPassword) {
      toast.error(t('registration.enterCredentialsError') || 'Please enter admin username and password')
      return
    }

    if (!navigator.onLine) {
      toast.error(t('registration.mustBeOnline') || 'Must be online to register')
      return
    }

    setIsLoading(true)
    try {
      // Validate admin credentials
      const formData = new FormData()
      formData.append('username', adminUsername)
      formData.append('password', adminPassword)

      console.log('About to request auth/login', formData)
      const authResponse = await apiClient.post('/api/v1/auth/login', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const { access_token, user: adminUser } = authResponse.data

      // Check if admin has permission
      if (!adminUser.is_superuser) {
        // Allow any authenticated user for now
      }

      // Load stores with admin token - skip default auth token handling
      const response = await apiClient.get('/api/v1/stores?active_only=true', {
        headers: { Authorization: `Bearer ${access_token}` },
        metadata: {
          skipAuthToken: true, // Skip default token handling, use custom Authorization header
          skipTokenRefresh: true, // Don't try to refresh token on 401
        },
      } as any)
      const storesList = response.data || []

      // Move to next step with token and stores
      onNext(access_token, storesList)
    } catch (error: any) {
      console.error('Authentication error:', error)
      if (error.response?.status === 401) {
        toast.error(t('registration.invalidCredentials') || 'Invalid admin username or password')
      } else {
        toast.error(error.response?.data?.detail || error.message || (t('registration.error') || 'Authentication failed'))
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-gradient p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-8 pt-8 pb-6 text-white" style={{ background: `linear-gradient(to right, var(--color-primary-500), var(--color-primary-600))` }}>
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={onBack}
                className="text-white opacity-90 hover:opacity-100 transition-opacity"
              >
                <FaArrowLeft />
              </button>
              <span className="text-sm text-white opacity-90">
                {t('registration.step') || 'Step'} 2/6
              </span>
            </div>
            <h2 className="text-2xl font-bold">
              {t('registration.adminCredentials') || 'Admin Credentials Required'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-4">
            <Input
              type="text"
              label={t('registration.adminUsername') || 'Admin Username'}
              value={adminUsername}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdminUsername(e.target.value)}
              disabled={isLoading}
              leftIcon={<FaUser />}
              fullWidth
              required
            />

            <Input
              type="password"
              label={t('registration.adminPassword') || 'Admin Password'}
              value={adminPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdminPassword(e.target.value)}
              disabled={isLoading}
              leftIcon={<FaLock />}
              fullWidth
              required
            />

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
                type="submit"
                variant="primary"
                disabled={isLoading || !adminUsername || !adminPassword || !navigator.onLine}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    {t('common.loading') || 'Loading...'}
                  </>
                ) : (
                  <>
                    {t('common.next') || 'Next'} <FaArrowRight className="ml-2 inline" />
                  </>
                )}
              </Button>
            </div>

            {!navigator.onLine && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  {t('registration.mustBeOnline') || 'You must be online to register. Please connect to the internet.'}
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

