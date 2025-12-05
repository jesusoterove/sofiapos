/**
 * Login page component.
 * Attractive, dynamic but professional design inspired by modern food apps.
 */
import { useState, FormEvent, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@sofiapos/ui'
import { useTranslation } from '@/i18n/hooks'
import { toast } from 'react-toastify'

export function Login() {
  const { t } = useTranslation()
  const { login, isAuthenticated } = useAuth()
  const { currentTheme } = useTheme()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  // Get theme colors
  const theme = currentTheme.colors
  
  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/', replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!username || !password) {
      toast.error(t('auth.loginRequired') || 'Please enter username and password')
      return
    }

    setIsLoading(true)
    try {
      await login(username, password)
      toast.success(t('auth.loginSuccess') || 'Login successful!')
      // Navigation will happen via useEffect when isAuthenticated becomes true
    } catch (error: any) {
      toast.error(error.message || t('auth.loginError') || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen bg-theme-gradient flex items-center justify-center p-4"
      style={{
        background: `linear-gradient(to bottom right, ${theme.background.gradient.from}, ${theme.background.gradient.via}, ${theme.background.gradient.to})`,
      }}
    >
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-20 right-20 w-64 h-64 rounded-full blur-3xl opacity-30"
          style={{ backgroundColor: theme.primary[200] }}
        ></div>
        <div 
          className="absolute bottom-20 left-20 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: theme.primary[300] }}
        ></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Top Section - Theme Background */}
          <div 
            className="px-8 pt-12 pb-8 relative"
            style={{
              background: `linear-gradient(to bottom right, ${theme.primary[400]}, ${theme.primary[500]})`,
            }}
          >
            {/* Decorative brushstroke */}
            <div 
              className="absolute bottom-0 left-0 right-0 h-16 transform -skew-y-1 origin-bottom"
              style={{ backgroundColor: theme.primary[400] }}
            ></div>
            
            {/* Food icon illustration */}
            <div className="relative z-10 flex justify-end mb-6">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>

            {/* Welcome text */}
            <div className="relative z-10">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {t('auth.welcome') || 'Welcome!'}
              </h1>
              <p className="text-lg text-gray-800">
                {t('auth.signInToContinue') || 'Sign in to continue'}
              </p>
            </div>
          </div>

          {/* Form Section - White Background */}
          <div className="px-8 py-8 bg-white relative -mt-4 rounded-t-3xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Field */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.username')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all outline-none"
                    placeholder={t('auth.username') || 'Username'}
                    disabled={isLoading}
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all outline-none"
                    placeholder={t('auth.password') || 'Password'}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m13.42 13.42l-3.29-3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full text-gray-900 font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                style={{
                  background: `linear-gradient(to right, ${theme.primary[400]}, ${theme.primary[500]})`,
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = `linear-gradient(to right, ${theme.primary[500]}, ${theme.primary[600]})`
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = `linear-gradient(to right, ${theme.primary[400]}, ${theme.primary[500]})`
                  }
                }}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{t('common.loading') || 'Loading...'}</span>
                  </>
                ) : (
                  <>
                    <span>{t('auth.login') || 'Sign In'}</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* App Name/Branding */}
            <div className="mt-8 text-center">
              <p className="text-2xl font-bold" style={{ color: theme.text.primary }}>
                Sofia<span style={{ color: theme.primary[500] }}>POS</span>
              </p>
              <p className="text-sm mt-1" style={{ color: theme.text.secondary }}>
                Console Administration
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


