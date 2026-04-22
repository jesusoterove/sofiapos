/**
 * Main POS layout component.
 */
import React, { useEffect, useState } from 'react'
import { TopBar } from './TopBar'
import { BottomBar } from './BottomBar'

interface POSLayoutProps {
  children: React.ReactNode
  onSalesInvoicesClick?: () => void
  onHomeClick?: () => void
}

export function POSLayout({ children, onSalesInvoicesClick, onHomeClick }: POSLayoutProps) {
  const [isCompactHeight, setIsCompactHeight] = useState(false)

  useEffect(() => {
    const updateCompactHeight = () => {
      setIsCompactHeight(window.innerHeight < 800)
    }

    updateCompactHeight()
    window.addEventListener('resize', updateCompactHeight)
    return () => window.removeEventListener('resize', updateCompactHeight)
  }, [])

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: 'var(--color-bg-default)' }}>
      <TopBar
        onSalesInvoicesClick={onSalesInvoicesClick}
        onHomeClick={onHomeClick}
        isCompactHeight={isCompactHeight}
      />
      <div className="flex-1 flex overflow-hidden">
        {children}
      </div>
      <BottomBar isCompactHeight={isCompactHeight} />
    </div>
  )
}

