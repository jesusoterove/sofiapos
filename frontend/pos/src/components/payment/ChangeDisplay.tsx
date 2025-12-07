/**
 * Change display component.
 */
import React from 'react'
import { Card } from '@sofiapos/ui'
import { useTranslation } from '@/i18n/hooks'

interface ChangeDisplayProps {
  change: number
}

export function ChangeDisplay({ change }: ChangeDisplayProps) {
  const { t } = useTranslation()

  return (
    <Card padding="md" className="text-center">
      <div className="text-sm mb-1" style={{ color: 'var(--color-text-secondary, #6B7280)' }}>
        {t('payment.change') || 'Change'}
      </div>
      <div
        className={`text-2xl font-bold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}
      >
        ${Math.abs(change).toFixed(2)}
      </div>
    </Card>
  )
}

