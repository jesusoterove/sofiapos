/**
 * Main POS layout component.
 */
import React from 'react'
import { TopBar } from './TopBar'
import { BottomBar } from './BottomBar'

interface POSLayoutProps {
  children: React.ReactNode
  onSalesInvoicesClick?: () => void
  onHomeClick?: () => void
}

export function POSLayout({ children, onSalesInvoicesClick, onHomeClick }: POSLayoutProps) {
  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: 'var(--color-bg-default)' }}>
      <TopBar onSalesInvoicesClick={onSalesInvoicesClick} onHomeClick={onHomeClick} />
      <div className="flex-1 flex overflow-hidden">
        {children}
      </div>
      <BottomBar />
    </div>
  )
}

