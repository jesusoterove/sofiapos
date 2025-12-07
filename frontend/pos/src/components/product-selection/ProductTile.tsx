/**
 * Product tile component for displaying individual products.
 */
import React from 'react'
import { useTranslation } from '@/i18n/hooks'

interface Product {
  id: number
  code: string
  name: string
  description?: string
  selling_price: number
  product_type: string
  category_id?: number
  is_active: boolean
}

interface ProductTileProps {
  product: Product
  onClick: () => void
}

export function ProductTile({ product, onClick }: ProductTileProps) {
  const { t } = useTranslation()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  return (
    <button
      onClick={onClick}
      className="bg-white border rounded-lg p-3 text-left hover:shadow-md transition-shadow touch-manipulation"
      style={{
        minHeight: '120px',
        minWidth: '120px',
        borderColor: 'var(--color-border-default, #E5E7EB)',
      }}
    >
      <div className="flex flex-col h-full">
        {/* Product Image Placeholder */}
        <div
          className="w-full h-16 bg-gray-200 rounded mb-2 flex items-center justify-center"
          style={{ backgroundColor: '#F3F4F6' }}
        >
          <span className="text-xs text-gray-500">{product.code}</span>
        </div>

        {/* Product Name */}
        <div className="text-sm font-medium mb-1 line-clamp-2" style={{ color: 'var(--color-text-primary, #111827)' }}>
          {product.name}
        </div>

        {/* Price */}
        <div className="text-base font-bold mt-auto" style={{ color: 'var(--color-primary-500, #3B82F6)' }}>
          {formatPrice(product.selling_price)}
        </div>
      </div>
    </button>
  )
}

