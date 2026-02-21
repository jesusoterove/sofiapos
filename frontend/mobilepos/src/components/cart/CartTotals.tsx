import { View, Text, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useSofiaTheme } from '@/theme/sofia-theme'
import { formatCurrency } from '@sofiapos/shared/utils'
import type { CartTotals as Totals } from '@/stores/cartStore'

interface CartTotalsProps {
  totals: Totals
}

export function CartTotals({ totals }: CartTotalsProps) {
  const { t } = useTranslation()
  const { tokens } = useSofiaTheme()

  return (
    <View style={styles.container}>
      <View style={styles.line}>
        <Text style={[styles.label, { color: tokens.colors.text.secondary }]}>
          {t('sell.subtotal') || 'Subtotal'}
        </Text>
        <Text style={[styles.value, { color: tokens.colors.text.secondary }]}>
          {formatCurrency(totals.subtotal)}
        </Text>
      </View>
      <View style={styles.line}>
        <Text style={[styles.label, { color: tokens.colors.text.secondary }]}>
          {t('sell.taxes') || 'Taxes'}
        </Text>
        <Text style={[styles.value, { color: tokens.colors.text.secondary }]}>
          {formatCurrency(totals.taxes)}
        </Text>
      </View>
      {totals.discount > 0 && (
        <View style={styles.line}>
          <Text style={[styles.label, { color: '#22c55e' }]}>
            {t('sell.discount') || 'Discount'}
          </Text>
          <Text style={[styles.value, { color: '#22c55e' }]}>
            -{formatCurrency(totals.discount)}
          </Text>
        </View>
      )}
      <View style={[styles.line, styles.totalLine, { borderColor: tokens.colors.border.default }]}>
        <Text style={[styles.totalLabel, { color: tokens.colors.text.primary }]}>
          {t('sell.total') || 'Total'}
        </Text>
        <Text style={[styles.totalValue, { color: tokens.colors.primary[600] }]}>
          {formatCurrency(totals.total)}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  line: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 14 },
  value: { fontSize: 14 },
  totalLine: { marginTop: 4, paddingTop: 8, borderTopWidth: 1 },
  totalLabel: { fontSize: 17, fontWeight: '700' },
  totalValue: { fontSize: 17, fontWeight: '700' },
})
