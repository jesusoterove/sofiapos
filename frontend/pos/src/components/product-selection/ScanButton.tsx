/**
 * Barcode scanner button component.
 */
import React from 'react'
import { Button } from '@sofiapos/ui'
import { FaBarcode } from 'react-icons/fa'
import { useTranslation } from '@/i18n/hooks'

interface ScanButtonProps {
  onScan: (code: string) => void
}

export function ScanButton({ onScan }: ScanButtonProps) {
  const { t } = useTranslation()

  const handleClick = () => {
    // TODO: Implement barcode scanner integration
    // For now, prompt for manual entry
    const code = prompt(t('productSelection.scanBarcode') || 'Enter barcode:')
    if (code) {
      onScan(code)
    }
  }

  return (
    <Button
      onClick={handleClick}
      className="h-12 w-12 p-0 flex items-center justify-center"
      style={{
        minWidth: '48px',
        minHeight: '48px',
      }}
    >
      <FaBarcode />
    </Button>
  )
}

