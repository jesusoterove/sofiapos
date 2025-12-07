/**
 * Main POS layout component.
 */
import React from 'react'
import { TopBar } from './TopBar'
import { BottomBar } from './BottomBar'

interface POSLayoutProps {
  children: React.ReactNode
}

export function POSLayout({ children }: POSLayoutProps) {
  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: 'var(--color-bg-default)' }}>
      <TopBar />
      <div className="flex-1 flex overflow-hidden">
        {children}
      </div>
      <BottomBar />
    </div>
  )
}

