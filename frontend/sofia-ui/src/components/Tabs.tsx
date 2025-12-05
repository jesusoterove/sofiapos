/**
 * Tabs component for organizing content into tabbed sections.
 */
import { useState, ReactNode, useRef, useEffect } from 'react'

export interface Tab {
  id: string
  label: string
  content: ReactNode
  disabled?: boolean
}

export interface TabsProps {
  tabs: Tab[]
  defaultTab?: string
  className?: string
}

export function Tabs({ tabs, defaultTab, className = '' }: TabsProps) {
  const [activeTab, setActiveTab] = useState<string>(defaultTab || tabs[0]?.id || '')
  const [underlineStyle, setUnderlineStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 })
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})

  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content

  // Update underline position when active tab changes or on mount
  useEffect(() => {
    const updateUnderline = () => {
      const activeButton = tabRefs.current[activeTab]
      if (activeButton) {
        const { offsetLeft, offsetWidth } = activeButton
        setUnderlineStyle({ left: offsetLeft, width: offsetWidth })
      }
    }
    
    // Update immediately
    updateUnderline()
    
    // Also update after a short delay to ensure DOM is fully rendered
    const timeoutId = setTimeout(updateUnderline, 0)
    
    return () => clearTimeout(timeoutId)
  }, [activeTab, tabs])

  return (
    <div className={className}>
      {/* Tab Headers Bar */}
      <div className="relative border-b" style={{ borderColor: 'var(--color-border-default)' }}>
        <nav className="flex" aria-label="Tabs" style={{ position: 'relative' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              ref={(el: HTMLButtonElement | null) => {
                tabRefs.current[tab.id] = el
              }}
              onClick={() => !tab.disabled && setActiveTab(tab.id)}
              disabled={tab.disabled}
              className={`
                relative py-4 px-6 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
                }
                ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              style={{
                color: activeTab === tab.id ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
              }}
            >
              {tab.label}
            </button>
          ))}
          {/* Underline Indicator */}
          <div
            className="absolute bottom-0 h-0.5 transition-all duration-300 ease-in-out"
            style={{
              left: `${underlineStyle.left}px`,
              width: `${underlineStyle.width}px`,
              backgroundColor: 'var(--color-primary-500)',
            }}
          />
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTabContent}
      </div>
    </div>
  )
}

