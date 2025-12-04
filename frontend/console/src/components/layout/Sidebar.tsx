/**
 * Sidebar navigation component.
 */
import { Link, useLocation } from '@tanstack/react-router'
import { useTranslation } from '@/i18n/hooks'

const navigation = [
  { name: 'dashboard', path: '/', icon: '📊', translationKey: 'dashboard.title' },
  { name: 'stores', path: '/stores', icon: '🏪', translationKey: 'stores.title' },
  { name: 'users', path: '/users', icon: '👥', translationKey: 'common.users' },
  { name: 'products', path: '/products', icon: '📦', translationKey: 'products.title' },
  { name: 'orders', path: '/orders', icon: '🛒', translationKey: 'orders.title' },
  { name: 'inventory', path: '/inventory', icon: '📋', translationKey: 'inventory.title' },
  { name: 'settings', path: '/settings', icon: '⚙️', translationKey: 'settings.title' },
]

export function Sidebar() {
  const { t } = useTranslation()
  const location = useLocation()
  const currentPath = location.pathname

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-4">
        <h2 className="text-lg font-semibold">Navigation</h2>
      </div>
      
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = currentPath === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3 px-4 py-2 rounded-lg transition-colors
                ${isActive 
                  ? 'bg-gray-800 text-white' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }
              `}
            >
              <span>{item.icon}</span>
              <span>{t(item.translationKey) || item.name}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

