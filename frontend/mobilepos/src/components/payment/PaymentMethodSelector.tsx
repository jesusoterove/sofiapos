import { View, Pressable, Text, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useSofiaTheme } from '@/theme/sofia-theme'

type PaymentMethod = 'cash' | 'bank_transfer'

interface PaymentMethodSelectorProps {
  value: PaymentMethod
  onChange: (method: PaymentMethod) => void
}

export function PaymentMethodSelector({ value, onChange }: PaymentMethodSelectorProps) {
  const { t } = useTranslation()
  const { tokens } = useSofiaTheme()
  const primary = tokens.colors.primary

  const options: Array<{ key: PaymentMethod; icon: string; label: string }> = [
    { key: 'cash', icon: 'money', label: t('payment.cash') || 'Cash' },
    { key: 'bank_transfer', icon: 'credit-card', label: t('payment.bankTransfer') || 'Card / Transfer' },
  ]

  return (
    <View style={styles.row}>
      {options.map((opt) => {
        const active = value === opt.key
        return (
          <Pressable
            key={opt.key}
            style={[
              styles.option,
              { borderColor: active ? primary[500] : tokens.colors.border.default },
              active && { backgroundColor: primary[50] ?? '#eff6ff' },
            ]}
            onPress={() => onChange(opt.key)}
            accessibilityRole="button"
            accessibilityLabel={opt.label}
            accessibilityState={{ selected: active }}
          >
            <FontAwesome
              name={opt.icon as any}
              size={18}
              color={active ? primary[600] : tokens.colors.text.muted}
            />
            <Text style={[styles.optionText, { color: active ? primary[600] : tokens.colors.text.secondary }]}>
              {opt.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  option: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 10, borderWidth: 1.5 },
  optionText: { fontSize: 14, fontWeight: '600' },
})
