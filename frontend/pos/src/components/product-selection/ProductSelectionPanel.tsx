/**
 * Product selection panel component.
 */
import React from 'react'
import { ScanButton } from './ScanButton'
import { SearchBar } from './SearchBar'
import { CategoryTabs } from './CategoryTabs'
import { ProductList } from './ProductList'
import { useProductSelection } from '@/hooks/useProductSelection'

interface ProductSelectionPanelProps {
  onProductSelect: (product: any) => void
}

export function ProductSelectionPanel({ onProductSelect }: ProductSelectionPanelProps) {
  const {
    products,
    categories,
    selectedCategoryId,
    searchQuery,
    isLoading,
    selectCategory,
    setSearch,
  } = useProductSelection()

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white p-4">
      {/* Scan and Search */}
      <div className="flex gap-2 mb-4">
        <ScanButton onScan={(code) => console.log('Scanned:', code)} />
        <SearchBar
          value={searchQuery}
          onChange={setSearch}
          placeholder="Search products..."
        />
      </div>

      {/* Category Tabs */}
      <CategoryTabs
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={selectCategory}
      />

      {/* Product List */}
      <div className="flex-1 overflow-y-auto mt-4">
        <ProductList
          products={products}
          isLoading={isLoading}
          onProductSelect={onProductSelect}
        />
      </div>
    </div>
  )
}

