import { View, Text, Pressable, StyleSheet } from 'react-native'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useSofiaTheme } from '@/theme/sofia-theme'
import { formatCurrency } from '@sofiapos/shared/utils'
import type { CartItem } from '@/stores/cartStore'

interface CartItemRowProps {
  item: CartItem
  onUpdateQuantity: (quantity: number) => void
  onRemove: () => void
}

export function CartItemRow({ item, onUpdateQuantity, onRemove }: CartItemRowProps) {
  const { tokens } = useSofiaTheme()

  return (
    <View style={[styles.row, { borderColor: tokens.colors.border.light }]}>
      <View style={styles.info}>
        <Text style={[styles.name, { color: tokens.colors.text.primary }]} numberOfLines={1}>
          {item.productName}
        </Text>
        <Text style={[styles.pricePerUnit, { color: tokens.colors.text.muted }]}>
          {formatCurrency(item.unitPrice)} × {item.quantity}
        </Text>
      </View>

      <View style={styles.controls}>
        <View style={styles.qtyRow}>
          <Pressable
            style={[styles.qtyBtn, { borderColor: tokens.colors.border.default }]}
            onPress={() => onUpdateQuantity(item.quantity - 1)}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={`Decrease quantity of ${item.productName}`}
          >
            <FontAwesome name="minus" size={12} color={tokens.colors.text.secondary} />
          </Pressable>
          <Text
            style={[styles.qtyText, { color: tokens.colors.text.primary }]}
            accessibilityLabel={`Quantity: ${item.quantity}`}
            allowFontScaling
          >
            {item.quantity}
          </Text>
          <Pressable
            style={[styles.qtyBtn, { borderColor: tokens.colors.border.default }]}
            onPress={() => onUpdateQuantity(item.quantity + 1)}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={`Increase quantity of ${item.productName}`}
          >
            <FontAwesome name="plus" size={12} color={tokens.colors.text.secondary} />
          </Pressable>
        </View>

        <Text style={[styles.lineTotal, { color: tokens.colors.text.primary }]}>
          {formatCurrency(item.total)}
        </Text>
      </View>

      <Pressable
        onPress={onRemove}
        hitSlop={8}
        style={styles.removeBtn}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${item.productName} from cart`}
      >
        <FontAwesome name="trash-o" size={16} color="#ef4444" />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  info: { flex: 1, marginRight: 8 },
  name: { fontSize: 14, fontWeight: '500' },
  pricePerUnit: { fontSize: 12, marginTop: 2 },
  controls: { alignItems: 'flex-end', gap: 4 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 28, height: 28, borderRadius: 6, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontSize: 15, fontWeight: '600', minWidth: 20, textAlign: 'center' },
  lineTotal: { fontSize: 14, fontWeight: '600' },
  removeBtn: { marginLeft: 10, padding: 4 },
})
