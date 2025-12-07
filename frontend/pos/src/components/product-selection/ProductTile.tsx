/**
 * Product tile component for displaying individual products.
 */

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

interface ProductTileProps {
  product: Product
  onClick: () => void
}

export function ProductTile({ product, onClick }: ProductTileProps) {
  const formatPrice = (price: number) => {
    // Map language code to locale
    const locale = 'en-US'
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <button
      onClick={onClick}
      className="border rounded-lg p-1 text-left hover:shadow-md transition-shadow touch-manipulation"
      style={{
        minHeight: '100px',
        minWidth: '100px',
        maxWidth: '120px',
        backgroundColor: 'var(--color-bg-paper)',
        borderColor: 'var(--color-border-default)',
      }}
    >
      <div className="flex flex-col h-full">
        {/* Product Image Placeholder */}
        <div
          className="w-full rounded mb-2 flex items-center justify-center"
          style={{ 
            aspectRatio: '1 / 1',
            backgroundColor: 'var(--color-border-light)',
            maxWidth: '120px',
            maxHeight: '120px',
          }}
        >
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {product.code}
          </span>
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

