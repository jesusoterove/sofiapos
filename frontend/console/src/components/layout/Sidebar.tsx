/**
 * Sidebar navigation component.
 */
import { useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { useTranslation } from '@/i18n/hooks'

interface NavItem {
  name: string
  path?: string
  icon: string
  translationKey: string
  children?: NavItem[]
}

const navigation: NavItem[] = [
  { name: 'dashboard', path: '/', icon: '📊', translationKey: 'dashboard.title' },
  { name: 'stores', path: '/stores', icon: '🏪', translationKey: 'stores.title' },
  { name: 'users', path: '/users', icon: '👥', translationKey: 'common.users' },
  {
    name: 'inventory',
    icon: '📦',
    translationKey: 'inventory.title',
    children: [
      { name: 'ingredients', path: '/inventory/ingredients', icon: '🥘', translationKey: 'inventory.ingredients' },
      { name: 'products', path: '/inventory/products', icon: '📦', translationKey: 'inventory.products' },
    ],
  },
  { name: 'orders', path: '/orders', icon: '🛒', translationKey: 'orders.title' },
  { name: 'settings', path: '/settings', icon: '⚙️', translationKey: 'settings.title' },
]

export function Sidebar() {
  const { t } = useTranslation()
  const location = useLocation()
  const currentPath = location.pathname
  // Auto-expand parent items if a child route is active
  const [expandedItems, setExpandedItems] = useState<Set<string>>(() => {
    const expanded = new Set<string>()
    navigation.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some((child) => child.path === currentPath)
        if (hasActiveChild) {
          expanded.add(item.name)
        }
      }
    })
    return expanded
  })

  const toggleExpanded = (name: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(name)) {
      newExpanded.delete(name)
    } else {
      newExpanded.add(name)
    }
    setExpandedItems(newExpanded)
  }

  const isItemActive = (item: NavItem): boolean => {
    if (item.path && currentPath === item.path) return true
    if (item.children) {
      return item.children.some((child) => child.path === currentPath)
    }
    return false
  }

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-4">
        <h2 className="text-lg font-semibold">{t('common.navigation')}</h2>
      </div>
      
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = isItemActive(item)
          const isExpanded = expandedItems.has(item.name)
          const hasChildren = item.children && item.children.length > 0

          return (
            <div key={item.name}>
              {hasChildren ? (
                <>
                  <button
                    onClick={() => toggleExpanded(item.name)}
                    className={`
                      w-full flex items-center justify-between gap-3 px-4 py-2 rounded-lg transition-colors
                      ${isActive 
                        ? 'bg-gray-800 text-white' 
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <span>{item.icon}</span>
                      <span>{t(item.translationKey) || item.name}</span>
                    </div>
                    <span className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                      ▶
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.children!.map((child) => {
                        const isChildActive = currentPath === child.path
                        return (
                          <Link
                            key={child.path}
                            to={child.path!}
                            className={`
                              flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm
                              ${isChildActive 
                                ? 'bg-gray-800 text-white' 
                                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                              }
                            `}
                          >
                            <span>{child.icon}</span>
                            <span>{t(child.translationKey) || child.name}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  to={item.path!}
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
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}

