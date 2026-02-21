import { Pressable, Text, View, StyleSheet } from 'react-native'
import { useSofiaTheme } from '@/theme/sofia-theme'
import { formatCurrency } from '@sofiapos/shared/utils'

interface Product {
  id: number
  code: string
  name: string
  selling_price: number
}

interface ProductTileProps {
  product: Product
  onPress: () => void
}

export function ProductTile({ product, onPress }: ProductTileProps) {
  const { tokens } = useSofiaTheme()

  return (
    <Pressable
      style={[styles.tile, { borderColor: tokens.colors.border.default, backgroundColor: tokens.colors.background.paper }]}
      onPress={onPress}
      android_ripple={{ color: tokens.colors.primary[100] ?? '#e0e0e0' }}
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${formatCurrency(product.selling_price)}`}
      accessibilityHint="Double tap to add to cart"
    >
      <View style={[styles.imagePlaceholder, { backgroundColor: tokens.colors.border.light }]}>
        <Text style={[styles.code, { color: tokens.colors.text.muted }]} numberOfLines={1}>
          {product.code}
        </Text>
      </View>
      <Text style={[styles.name, { color: tokens.colors.text.primary }]} numberOfLines={2}>
        {product.name}
      </Text>
      <Text style={[styles.price, { color: tokens.colors.primary[600] }]}>
        {formatCurrency(product.selling_price)}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  tile: { borderWidth: 1, borderRadius: 10, padding: 6, width: 120 },
  imagePlaceholder: { aspectRatio: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  code: { fontSize: 11 },
  name: { fontSize: 13, fontWeight: '500', marginBottom: 2, minHeight: 34 },
  price: { fontSize: 14, fontWeight: '700' },
})
