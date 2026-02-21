import { View, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { SearchBar } from './SearchBar'
import { CategoryChips } from './CategoryChips'
import { ProductGrid } from './ProductGrid'
import { useProductSelection } from '@/hooks/useProductSelection'

interface CatalogPanelProps {
  onProductSelect: (product: { id: number; name: string; selling_price: number; tax_rate: number }) => void
}

export function CatalogPanel({ onProductSelect }: CatalogPanelProps) {
  const { t } = useTranslation()
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
    <View style={styles.container}>
      <SearchBar
        value={searchQuery}
        onChangeText={setSearch}
        placeholder={t('sell.searchProducts') || 'Search products...'}
      />
      <CategoryChips
        categories={categories}
        selectedId={selectedCategoryId}
        onSelect={selectCategory}
      />
      <View style={styles.grid}>
        <ProductGrid
          products={products}
          isLoading={isLoading}
          onProductPress={onProductSelect}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 12, paddingTop: 8 },
  grid: { flex: 1, marginTop: 4 },
})
