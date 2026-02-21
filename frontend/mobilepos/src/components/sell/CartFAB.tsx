import { Pressable, Text, StyleSheet } from 'react-native'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useSofiaTheme } from '@/theme/sofia-theme'
import { useCartStore } from '@/stores/cartStore'
import { formatCurrency } from '@sofiapos/shared/utils'

interface CartFABProps {
  onPress: () => void
}

export function CartFAB({ onPress }: CartFABProps) {
  const { tokens } = useSofiaTheme()
  const items = useCartStore((s) => s.items)
  const getTotals = useCartStore((s) => s.getTotals)

  if (items.length === 0) return null

  const totals = getTotals()

  return (
    <Pressable
      style={[styles.fab, { backgroundColor: tokens.colors.primary[600] }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View cart, ${items.length} items, ${formatCurrency(totals.total)}`}
      accessibilityHint="Opens the shopping cart"
    >
      <FontAwesome name="shopping-cart" size={18} color="#fff" />
      <Text style={styles.fabText}>
        {items.length} items · {formatCurrency(totals.total)}
      </Text>
      <FontAwesome name="chevron-up" size={14} color="#fff" />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  fabText: { color: '#fff', fontSize: 15, fontWeight: '600' },
})
