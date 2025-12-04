/**
 * Header component for the console application.
 */
import { LanguageSwitcher } from '../ui/LanguageSwitcher'
import { ThemeSwitcher } from '../ui/ThemeSwitcher'
import { useTranslation } from '@/i18n/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from '@tanstack/react-router'

export function Header() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  
  const handleLogout = () => {
    logout()
    navigate({ to: '/login' })
  }
  
  return (
    <header 
      className="border-b px-6 py-4 flex items-center justify-between"
      style={{
        backgroundColor: 'var(--color-bg-paper)',
        borderColor: 'var(--color-border-default)',
      }}
    >
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Sofia<span style={{ color: 'var(--color-primary-500)' }}>POS</span> Console
        </h1>
      </div>
      
      <div className="flex items-center gap-4">
        {user && (
          <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {user.full_name || user.username}
          </div>
        )}
        <ThemeSwitcher />
        <LanguageSwitcher />
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm rounded-lg transition-colors"
          style={{
            color: 'var(--color-text-secondary)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-border-light)'
            e.currentTarget.style.color = 'var(--color-text-primary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = 'var(--color-text-secondary)'
          }}
        >
          {t('auth.logout')}
        </button>
      </div>
    </header>
  )
}

