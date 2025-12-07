/**
 * Customer selector component.
 */
import React from 'react'
import { IconButton } from '@sofiapos/ui'
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
      <IconButton
        variant="secondary"
        onClick={handleLookup}
        className="h-9 w-9 flex items-center justify-center "
        title={t('order.lookupCustomer') || 'Lookup'}
      >
        <FaSearch className="mr-1" />
      </IconButton>
      <IconButton
        variant="secondary"
        onClick={handleNew}
        className="h-9 w-9 flex items-center justify-center "
        title={t('order.newCustomer') || 'New'}
      >
        <FaPlus className="mr-1" />
      </IconButton>
    </div>
  )
}

