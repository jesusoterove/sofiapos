/**
 * Customer selector component.
 */
import React from 'react'
import { Button } from '@sofiapos/ui'
import { useTranslation } from '@/i18n/hooks'
import { FaSearch, FaPlus } from 'react-icons/fa'

interface CustomerSelectorProps {
  customerId?: number
  onSelectCustomer: (customerId?: number) => void
}

export function CustomerSelector({ customerId, onSelectCustomer }: CustomerSelectorProps) {
  const { t } = useTranslation()

  const handleLookup = () => {
    // TODO: Open customer lookup modal
    console.log('Lookup customer')
  }

  const handleNew = () => {
    // TODO: Open new customer modal
    console.log('New customer')
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 text-sm" style={{ color: 'var(--color-text-primary, #111827)' }}>
        {customerId ? `Customer #${customerId}` : t('order.defaultCustomer') || 'Walk-in Customer'}
      </div>
      <Button
        variant="secondary"
        onClick={handleLookup}
        className="h-9 px-3 text-sm"
      >
        <FaSearch className="mr-1" />
        {t('order.lookupCustomer') || 'Lookup'}
      </Button>
      <Button
        variant="secondary"
        onClick={handleNew}
        className="h-9 px-3 text-sm"
      >
        <FaPlus className="mr-1" />
        {t('order.newCustomer') || 'New'}
      </Button>
    </div>
  )
}

