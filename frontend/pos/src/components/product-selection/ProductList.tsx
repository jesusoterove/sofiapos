/**
 * Product list component displaying products in a flex wrap layout.
 * Tiles flow left to right and wrap to next row when space runs out.
 */
import { ProductTile } from './ProductTile'
import { Spinner } from '@sofiapos/ui'
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

interface ProductListProps {
  products: Product[]
  isLoading: boolean
  onProductSelect: (product: Product) => void
}

export function ProductList({ products, isLoading, onProductSelect }: ProductListProps) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: 'var(--color-text-secondary)' }}>
        {t('productSelection.noProducts') || 'No products found'}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-1">
      {products.map((product) => (
        <ProductTile
          key={product.id}
          product={product}
          onClick={() => onProductSelect(product)}
        />
      ))}
    </div>
  )
}

