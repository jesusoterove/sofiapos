import { useState, useCallback } from 'react'
import { View, StyleSheet, useWindowDimensions, Modal, Pressable, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import * as Haptics from 'expo-haptics'
import Toast from 'react-native-toast-message'
import FontAwesome from '@expo/vector-icons/FontAwesome'

import { useSofiaTheme } from '@/theme/sofia-theme'
import { useCartStore } from '@/stores/cartStore'
import { useOrderManagement } from '@/hooks/useOrderManagement'
import { useAuth } from '@/contexts/AuthContext'
import { CatalogPanel } from '@/components/sell/CatalogPanel'
import { CartPanel } from '@/components/cart/CartPanel'
import { CartFAB } from '@/components/sell/CartFAB'
import { PaymentScreen } from '@/screens/PaymentScreen'

const TABLET_BREAKPOINT = 768

export default function SellScreen() {
  const { t } = useTranslation()
  const { tokens } = useSofiaTheme()
  const { width } = useWindowDimensions()
  const { user } = useAuth()
  const isTablet = width >= TABLET_BREAKPOINT
  const storeId = user?.store_id ?? 1

  const addItem = useCartStore((s) => s.addItem)
  const cart = useCartStore()
  const { saveDraft, markAsPaid, clearOrder } = useOrderManagement(storeId)

  const [cartVisible, setCartVisible] = useState(false)
  const [paymentVisible, setPaymentVisible] = useState(false)

  const handleProductSelect = useCallback((product: { id: number; name: string; selling_price: number; tax_rate: number }) => {
    addItem(product)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
  }, [addItem])

  const handleOpenPayment = useCallback(() => {
    setCartVisible(false)
    setPaymentVisible(true)
  }, [])

  const handleProcessPayment = useCallback(async (method: 'cash' | 'bank_transfer', amountPaid: number) => {
    await markAsPaid(method, amountPaid)
    setPaymentVisible(false)
    Toast.show({ type: 'success', text1: t('sell.paymentSuccess') || 'Payment complete!' })
  }, [markAsPaid, t])

  const handleSaveDraft = useCallback(async () => {
    try {
      await saveDraft()
      setCartVisible(false)
      Toast.show({ type: 'success', text1: t('sell.orderSaved') || 'Order saved' })
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e.message || 'Save failed' })
    }
  }, [saveDraft, t])

  const handleClear = useCallback(async () => {
    await clearOrder()
    setCartVisible(false)
  }, [clearOrder])

  if (isTablet) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: tokens.colors.background.default }]} edges={['top']}>
        <View style={styles.tabletRow}>
          <View style={styles.catalogSide}>
            <CatalogPanel onProductSelect={handleProductSelect} />
          </View>
          <View style={[styles.cartSide, { borderColor: tokens.colors.border.default }]}>
            <CartPanel onPay={handleOpenPayment} onSaveDraft={handleSaveDraft} onClear={handleClear} />
          </View>
        </View>
        <PaymentScreen visible={paymentVisible} onClose={() => setPaymentVisible(false)} onProcessPayment={handleProcessPayment} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tokens.colors.background.default }]} edges={['top']}>
      <CatalogPanel onProductSelect={handleProductSelect} />
      <CartFAB onPress={() => setCartVisible(true)} />

      <Modal
        visible={cartVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCartVisible(false)}
      >
        <SafeAreaView style={[styles.modalSafe, { backgroundColor: tokens.colors.background.default }]}>
          <View style={[styles.modalHeader, { borderColor: tokens.colors.border.light }]}>
            <Text style={[styles.modalTitle, { color: tokens.colors.text.primary }]}>
              {t('sell.cart') || 'Cart'}
            </Text>
            <Pressable onPress={() => setCartVisible(false)} hitSlop={12}>
              <FontAwesome name="chevron-down" size={18} color={tokens.colors.text.secondary} />
            </Pressable>
          </View>
          <CartPanel onPay={handleOpenPayment} onSaveDraft={handleSaveDraft} onClear={handleClear} />
        </SafeAreaView>
      </Modal>

      <PaymentScreen visible={paymentVisible} onClose={() => setPaymentVisible(false)} onProcessPayment={handleProcessPayment} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  tabletRow: { flex: 1, flexDirection: 'row' },
  catalogSide: { flex: 3 },
  cartSide: { flex: 2, borderLeftWidth: 1 },
  modalSafe: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  modalTitle: { fontSize: 18, fontWeight: '600' },
})
