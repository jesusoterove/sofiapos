/**
 * Product list component displaying products in a grid.
 */
import React from 'react'
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
      <div className="flex items-center justify-center h-full text-gray-500">
        {t('productSelection.noProducts') || 'No products found'}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
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

