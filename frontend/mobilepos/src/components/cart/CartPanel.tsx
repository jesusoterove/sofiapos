import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useSofiaTheme } from '@/theme/sofia-theme'
import { useCartStore } from '@/stores/cartStore'
import { CartItemRow } from './CartItemRow'
import { CartTotals } from './CartTotals'
import FontAwesome from '@expo/vector-icons/FontAwesome'

interface CartPanelProps {
  onPay: () => void
  onSaveDraft: () => void
  onClear: () => void
}

export function CartPanel({ onPay, onSaveDraft, onClear }: CartPanelProps) {
  const { t } = useTranslation()
  const { tokens } = useSofiaTheme()
  const items = useCartStore((s) => s.items)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)
  const getTotals = useCartStore((s) => s.getTotals)

  const totals = getTotals()
  const hasItems = items.length > 0

  return (
    <View style={[styles.container, { backgroundColor: tokens.colors.background.paper }]}>
      {/* Header */}
      <View style={[styles.header, { borderColor: tokens.colors.border.light }]}>
        <FontAwesome name="shopping-cart" size={16} color={tokens.colors.text.primary} />
        <Text style={[styles.headerTitle, { color: tokens.colors.text.primary }]}>
          {t('sell.cart') || 'Cart'}
        </Text>
        <Text style={[styles.badge, { backgroundColor: tokens.colors.primary[500] }]}>
          {items.length}
        </Text>
      </View>

      {/* Items */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <CartItemRow
            item={item}
            onUpdateQuantity={(qty) => updateQuantity(item.id, qty)}
            onRemove={() => removeItem(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <FontAwesome name="shopping-basket" size={36} color={tokens.colors.text.muted} />
            <Text style={[styles.emptyText, { color: tokens.colors.text.muted }]}>
              {t('sell.emptyCart') || 'Tap a product to start'}
            </Text>
          </View>
        }
      />

      {/* Totals + Actions */}
      {hasItems && (
        <View style={[styles.footer, { borderColor: tokens.colors.border.default }]}>
          <CartTotals totals={totals} />
          <View style={styles.actions}>
            <Pressable
              style={[styles.btnSecondary, { borderColor: tokens.colors.border.default }]}
              onPress={onClear}
              accessibilityRole="button"
              accessibilityLabel={t('sell.clearOrder') || 'Clear'}
            >
              <Text style={[styles.btnSecondaryText, { color: tokens.colors.text.secondary }]} allowFontScaling>
                {t('sell.clearOrder') || 'Clear'}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.btnSecondary, { borderColor: tokens.colors.border.default }]}
              onPress={onSaveDraft}
              accessibilityRole="button"
              accessibilityLabel={t('sell.saveDraft') || 'Save'}
            >
              <Text style={[styles.btnSecondaryText, { color: tokens.colors.text.secondary }]} allowFontScaling>
                {t('sell.saveDraft') || 'Save'}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.btnPrimary, { backgroundColor: tokens.colors.primary[600] }]}
              onPress={onPay}
              accessibilityRole="button"
              accessibilityLabel={t('sell.pay') || 'Pay'}
            >
              <FontAwesome name="credit-card" size={14} color="#fff" />
              <Text style={styles.btnPrimaryText} allowFontScaling>
                {t('sell.pay') || 'Pay'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontSize: 16, fontWeight: '600', flex: 1 },
  badge: { minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 14 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: 14 },
  footer: { borderTopWidth: 1, padding: 14, gap: 12 },
  actions: { flexDirection: 'row', gap: 8 },
  btnSecondary: { flex: 1, height: 44, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  btnSecondaryText: { fontSize: 14, fontWeight: '500' },
  btnPrimary: { flex: 2, height: 44, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '600' },
})
