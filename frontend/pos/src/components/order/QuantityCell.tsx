/**
 * Quantity cell component with inline editing.
 */
import { useState, useRef, useEffect } from 'react'
import { IconButton } from '@sofiapos/ui'
import { FaMinus, FaPlus } from 'react-icons/fa'
import { useTranslation } from '@/i18n/hooks'

export interface OrderItemData {
  id: string
  productId: number
  productName: string
  quantity: number
  unitPrice: number
  total: number
}

interface QuantityCellProps {
  item: OrderItemData
  onUpdateQuantity: (itemId: string, quantity: number) => void
}

export function QuantityCell({ item, onUpdateQuantity }: QuantityCellProps) {
  const { t } = useTranslation()
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(item.quantity.toString())
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    setEditValue(item.quantity.toString())
  }, [item.quantity])

  const handleClick = () => {
    setIsEditing(true)
    setEditValue(item.quantity.toString())
  }

  const handleBlur = () => {
    handleSave()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setIsEditing(false)
      setEditValue(item.quantity.toString())
    }
  }

  const handleSave = () => {
    const newQuantity = parseFloat(editValue)
    if (!isNaN(newQuantity) && newQuantity > 0) {
      onUpdateQuantity(item.id, Math.floor(newQuantity))
    } else {
      setEditValue(item.quantity.toString())
    }
    setIsEditing(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Allow empty string, numbers, and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setEditValue(value)
    }
  }

  return (
    <div className="flex items-center gap-1 justify-center">
      <IconButton
        variant="secondary"
        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
        className="h-8 w-8 p-0 flex items-center justify-center"
        title={t('common.remove') || 'Decrease'}
      >
        <FaMinus />
      </IconButton>
      {isEditing ? (
        <input
          ref={inputRef}
          type="number"
          value={editValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-12 h-8 text-center font-medium p-1 border rounded [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          style={{
            borderColor: 'var(--color-border-default)',
            backgroundColor: 'var(--color-bg-paper)',
            color: 'var(--color-text-primary)',
          }}
          min="1"
          step="1"
        />
      ) : (
        <span
          onClick={handleClick}
          className="w-12 h-8 text-center font-medium cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 transition-colors flex items-center justify-center"
          style={{ color: 'var(--color-text-primary)' }}
          title={t('order.clickToEditQuantity') || 'Click to edit quantity'}
        >
          {item.quantity}
        </span>
      )}
      <IconButton
        variant="secondary"
        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
        className="h-8 w-8 p-0 flex items-center justify-center"
        title={t('common.add') || 'Increase'}
      >
        <FaPlus />
      </IconButton>
    </div>
  )
}

