/**
 * Product tile component for displaying individual products.
 */
import { formatPrice } from '@sofiapos/ui'
import { useState, useEffect } from 'react'
import { getProductImageUrl } from '@/utils/productImages'

interface Product {
  id: number
  code: string
  name: string
  description?: string
  selling_price: number
  product_type: string
  category_id?: number
  is_active: boolean
  tax_rate: number
}

type ProductTileSize = 'small' | 'medium' | 'large'

interface ProductTileProps {
  product: Product
  onClick: () => void
  size?: ProductTileSize
}

const SIZE_DIMENSIONS: Record<ProductTileSize, number> = {
  small: 110,
  medium: 150,
  large: 190,
}

export function ProductTile({ product, onClick, size = 'small' }: ProductTileProps) {
  const imageSize = SIZE_DIMENSIONS[size]
  const imageSizePx = `${imageSize}px`
  const buttonMaxWidth = `${imageSize + 8}px` // imageSize + 8px for padding (p-1 = 4px on each side)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)

  // Load product image from local storage
  useEffect(() => {
    if (product.code) {
      getProductImageUrl(product.code)
        .then((url) => {
          if (url) {
            setImageUrl(url)
            setImageError(false)
          }
        })
        .catch(() => {
          setImageError(true)
        })
    }
  }, [product.code])

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl)
      }
    }
  }, [imageUrl])

  return (
    <button
      onClick={onClick}
      className="border rounded-lg p-1 text-left hover:shadow-md transition-shadow touch-manipulation"
      style={{
        minHeight: '100px',
        minWidth: '100px',
        maxWidth: buttonMaxWidth,
        backgroundColor: 'var(--color-bg-paper)',
        borderColor: 'var(--color-border-default)',
      }}
    >
      <div className="flex flex-col h-full">
        {/* Product Image */}
        <div
          className="rounded flex items-center justify-center overflow-hidden"
          style={{ 
            aspectRatio: '1 / 1',
            width: imageSizePx,
            height: imageSizePx,
            backgroundColor: 'var(--color-border-light)',
          }}
        >
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {product.code}
            </span>
          )}
        </div>

        {/* Product Name */}
        <div className="text-sm font-medium mb-1 line-clamp-2" style={{ color: 'var(--color-text-primary)' }}>
          {product.name}
        </div>

        {/* Price */}
        <div className="text-base font-bold mt-auto" style={{ color: 'var(--color-primary-500)' }}>
          {formatPrice(product.selling_price)}
        </div>
      </div>
    </button>
  )
}

