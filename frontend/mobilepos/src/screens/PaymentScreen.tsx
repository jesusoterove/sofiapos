import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, Pressable, Modal, StyleSheet, ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import * as Haptics from 'expo-haptics'
import Toast from 'react-native-toast-message'

import { useSofiaTheme } from '@/theme/sofia-theme'
import { useShift } from '@/contexts/ShiftContext'
import { useCartStore } from '@/stores/cartStore'
import { NumericKeypad } from '@/components/payment/NumericKeypad'
import { PaymentMethodSelector } from '@/components/payment/PaymentMethodSelector'
import { CartTotals } from '@/components/cart/CartTotals'
import { formatCurrency } from '@sofiapos/shared/utils'

interface PaymentScreenProps {
  visible: boolean
  onClose: () => void
  onProcessPayment: (method: 'cash' | 'bank_transfer', amountPaid: number) => Promise<void>
}

export function PaymentScreen({ visible, onClose, onProcessPayment }: PaymentScreenProps) {
  const { t } = useTranslation()
  const { tokens } = useSofiaTheme()
  const { hasOpenShift } = useShift()
  const getTotals = useCartStore((s) => s.getTotals)
  const primary = tokens.colors.primary

  const totals = getTotals()
  const orderTotal = totals.total

  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer'>('cash')
  const [amountStr, setAmountStr] = useState('')
  const [processing, setProcessing] = useState(false)

  const amountPaid = parseFloat(amountStr || '0')
  const change = amountPaid - orderTotal
  const canPay = amountPaid >= orderTotal && orderTotal > 0

  useEffect(() => {
    if (visible) {
      setAmountStr('')
      setPaymentMethod('cash')
    }
  }, [visible])

  const handleNumberPress = useCallback((num: string) => {
    setAmountStr((prev) => {
      const next = prev + num
      if (next.includes('.')) {
        const [, decimals] = next.split('.')
        if (decimals && decimals.length > 2) return prev
      }
      return next
    })
    Haptics.selectionAsync().catch(() => {})
  }, [])

  const handleDecimalPress = useCallback(() => {
    setAmountStr((prev) => {
      if (prev.includes('.')) return prev
      return prev ? prev + '.' : '0.'
    })
  }, [])

  const handleBackspace = useCallback(() => {
    setAmountStr((prev) => prev.slice(0, -1))
  }, [])

  const handleClear = useCallback(() => {
    setAmountStr('')
  }, [])

  const handleExact = useCallback(() => {
    setAmountStr(orderTotal.toFixed(2))
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
  }, [orderTotal])

  const handlePay = async () => {
    if (!canPay) return
    setProcessing(true)
    try {
      await onProcessPayment(paymentMethod, amountPaid)
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e.message || 'Payment failed' })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.safe, { backgroundColor: tokens.colors.background.default }]}>
        {/* Header */}
        <View style={[styles.header, { borderColor: tokens.colors.border.light }]}>
          <Text style={[styles.headerTitle, { color: tokens.colors.text.primary }]}>
            {t('payment.title') || 'Payment'}
          </Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <FontAwesome name="times" size={20} color={tokens.colors.text.secondary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Shift warning */}
          {!hasOpenShift && (
            <View style={styles.warningBanner}>
              <FontAwesome name="exclamation-triangle" size={14} color="#854d0e" />
              <Text style={styles.warningText}>
                {t('payment.noOpenShift') || 'No shift is open. Open a shift before processing payments.'}
              </Text>
            </View>
          )}

          {/* Payment method */}
          <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />

          {/* Order total */}
          <View style={[styles.totalCard, { borderColor: tokens.colors.border.default, backgroundColor: tokens.colors.background.paper }]}>
            <CartTotals totals={totals} />
          </View>

          {/* Amount display */}
          <View style={[styles.amountDisplay, { borderColor: tokens.colors.border.default, backgroundColor: tokens.colors.background.paper }]}>
            <Text style={[styles.amountLabel, { color: tokens.colors.text.muted }]}>
              {t('payment.tenderedAmount') || 'Tendered'}
            </Text>
            <Text style={[styles.amountValue, { color: tokens.colors.text.primary }]}>
              {amountStr || '0.00'}
            </Text>
          </View>

          {/* Change */}
          {paymentMethod === 'cash' && amountPaid > 0 && (
            <View style={[styles.changeRow, { backgroundColor: change >= 0 ? '#f0fdf4' : '#fef2f2' }]}>
              <Text style={[styles.changeLabel, { color: change >= 0 ? '#166534' : '#991b1b' }]}>
                {t('payment.change') || 'Change'}
              </Text>
              <Text style={[styles.changeValue, { color: change >= 0 ? '#166534' : '#991b1b' }]}>
                {formatCurrency(Math.max(0, change))}
              </Text>
            </View>
          )}

          {/* Keypad */}
          <NumericKeypad
            onNumberPress={handleNumberPress}
            onDecimalPress={handleDecimalPress}
            onBackspace={handleBackspace}
            onClear={handleClear}
          />

          {/* Bottom actions */}
          <View style={styles.actions}>
            <Pressable style={[styles.exactBtn, { borderColor: tokens.colors.border.default }]} onPress={handleExact}>
              <Text style={[styles.exactText, { color: tokens.colors.text.secondary }]}>
                {t('payment.exact') || 'EXACT'}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.payBtn, { backgroundColor: canPay ? '#22c55e' : tokens.colors.border.default }]}
              onPress={handlePay}
              disabled={!canPay || processing}
            >
              <FontAwesome name="check" size={18} color="#fff" />
              <Text style={styles.payBtnText}>
                {processing
                  ? (t('common.loading') || 'Processing...')
                  : (t('payment.pay') || 'PAY')}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontSize: 20, fontWeight: '600' },
  scroll: { padding: 20, gap: 14 },
  warningBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fefce8', borderWidth: 1, borderColor: '#fde68a', borderRadius: 10, padding: 12 },
  warningText: { fontSize: 13, color: '#854d0e', flex: 1 },
  totalCard: { borderWidth: 1, borderRadius: 12, padding: 14 },
  amountDisplay: { borderWidth: 1, borderRadius: 12, padding: 16, alignItems: 'center' },
  amountLabel: { fontSize: 13 },
  amountValue: { fontSize: 36, fontWeight: '700', marginTop: 4 },
  changeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 10, padding: 14 },
  changeLabel: { fontSize: 15, fontWeight: '600' },
  changeValue: { fontSize: 20, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  exactBtn: { flex: 1, height: 52, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  exactText: { fontSize: 15, fontWeight: '600' },
  payBtn: { flex: 2, height: 52, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  payBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
})
