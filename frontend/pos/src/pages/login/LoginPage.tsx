/**
 * Login page for POS application.
 * Supports online login (first time) and offline login (using local password).
 */
import { useState, FormEvent, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from '@/i18n/hooks'
import { Button, Input } from '@sofiapos/ui'
import { toast } from 'react-toastify'
import { FaEye, FaEyeSlash, FaWifi, FaBan } from 'react-icons/fa'
import { isRegistered } from '@/utils/registration'

export function LoginPage() {
  const { t } = useTranslation()
  const { login, loginOffline, isAuthenticated, hasLocalPassword } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showOfflineLogin, setShowOfflineLogin] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      // Check if registered, if not go to registration
      if (!isRegistered()) {
        navigate({ to: '/register', replace: true })
      } else {
        // Check shift status
        navigate({ to: '/check-shift', replace: true })
      }
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  // Show offline login option if offline and has local password
  useEffect(() => {
    if (!isOnline && hasLocalPassword) {
      setShowOfflineLogin(true)
    }
  }, [isOnline, hasLocalPassword])

  const handleOnlineLogin = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!username || !password) {
      toast.error(t('auth.loginRequired') || 'Please enter username and password')
      return
    }

    if (!isOnline) {
      toast.error('Must be online for initial login')
      return
    }

    setIsLoading(true)
    try {
      await login(username, password)
      toast.success(t('auth.loginSuccess') || 'Login successful!')
      navigate({ to: '/', replace: true })
    } catch (error: any) {
      toast.error(error.message || t('auth.loginError') || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOfflineLogin = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!password) {
      toast.error('Please enter your local password')
      return
    }

    setIsLoading(true)
    try {
      const success = await loginOffline(password)
      if (success) {
        toast.success('Offline login successful!')
        navigate({ to: '/', replace: true })
      } else {
        toast.error('Invalid local password. Please login online to reset.')
      }
    } catch (error: any) {
      toast.error(error.message || 'Offline login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-gradient p-4">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-12 pb-8 text-white" style={{ background: `linear-gradient(to right, var(--color-primary-500), var(--color-primary-600))` }}>
            <h1 className="text-3xl font-bold mb-2">
              {t('auth.welcome') || 'Welcome!'}
            </h1>
            <p className="text-white opacity-90">
              {t('auth.signInToContinue') || 'Sign in to continue'}
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm">
              {isOnline ? (
                <>
                  <FaWifi className="text-green-200" />
                  <span className="text-white opacity-90">Online</span>
                </>
              ) : (
                <>
                  <FaBan className="text-yellow-200" />
                  <span className="text-yellow-200">Offline</span>
                </>
              )}
            </div>
          </div>

          {/* Form Section */}
          <div className="px-8 py-8">
            {showOfflineLogin && !isOnline ? (
              <>
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    You are offline. Use your local password to continue.
                  </p>
                  {!hasLocalPassword && (
                    <p className="text-sm text-yellow-800 mt-2">
                      No local password found. Please connect to the internet to login.
                    </p>
                  )}
                </div>
                <form onSubmit={handleOfflineLogin} className="space-y-4">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    label="Local Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    }
                    fullWidth
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isLoading || !password}
                    className="w-full"
                  >
                    {isLoading ? (t('common.loading') || 'Loading...') : 'Login Offline'}
                  </Button>
                  <p className="text-xs text-center text-gray-500 mt-4">
                    Forgot your local password? Connect to the internet and login online to reset it.
                  </p>
                </form>
              </>
            ) : (
              <form onSubmit={handleOnlineLogin} className="space-y-4">
                <Input
                  type="text"
                  label={t('auth.username') || 'Username'}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading || !isOnline}
                  fullWidth
                />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  label={t('auth.password') || 'Password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading || !isOnline}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  }
                  fullWidth
                />
                {!isOnline && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      You are offline. Please connect to the internet to login.
                    </p>
                  </div>
                )}
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isLoading || !isOnline || !username || !password}
                  className="w-full"
                >
                  {isLoading ? (t('common.loading') || 'Loading...') : (t('auth.login') || 'Login')}
                </Button>
                {hasLocalPassword && isOnline && (
                  <p className="text-xs text-center text-gray-500 mt-4">
                    After logging in, you can use your password offline.
                  </p>
                )}
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 pb-6 text-center">
            <p className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Sofia<span style={{ color: 'var(--color-primary-600)' }}>POS</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Point of Sale
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

