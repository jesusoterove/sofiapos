import { FlatList, View, Text, ActivityIndicator, StyleSheet, useWindowDimensions } from 'react-native'
import { useTranslation } from 'react-i18next'
import { ProductTile } from './ProductTile'
import { useSofiaTheme } from '@/theme/sofia-theme'

interface Product {
  id: number
  code: string
  name: string
  selling_price: number
  tax_rate: number
}

interface ProductGridProps {
  products: Product[]
  isLoading: boolean
  onProductPress: (product: Product) => void
}

const TILE_WIDTH = 120
const TILE_GAP = 10

export function ProductGrid({ products, isLoading, onProductPress }: ProductGridProps) {
  const { t } = useTranslation()
  const { tokens } = useSofiaTheme()
  const { width } = useWindowDimensions()

  const numColumns = Math.max(2, Math.floor((width - 32) / (TILE_WIDTH + TILE_GAP)))

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={tokens.colors.primary[500]} />
      </View>
    )
  }

  if (products.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={[styles.emptyText, { color: tokens.colors.text.muted }]}>
          {t('sell.noProducts') || 'No products found'}
        </Text>
      </View>
    )
  }

  return (
    <FlatList
      data={products}
      keyExtractor={(item) => String(item.id)}
      numColumns={numColumns}
      key={numColumns}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.content}
      renderItem={({ item }) => (
        <ProductTile product={item} onPress={() => onProductPress(item)} />
      )}
    />
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { fontSize: 15 },
  row: { gap: TILE_GAP, paddingHorizontal: 4, marginBottom: TILE_GAP },
  content: { paddingVertical: 4 },
})
