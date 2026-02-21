import { useState } from 'react'
import {
  View, Text, Pressable, StyleSheet, FlatList, TextInput, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import Toast from 'react-native-toast-message'
import { useSofiaTheme } from '@/theme/sofia-theme'
import type { Store } from '@/api/auth'

interface Props {
  stores: Store[]
  onNext: (storeId: number, storeName: string, cashierName: string) => Promise<void>
  onBack: () => void
}

export default function StoreStep({ stores, onNext, onBack }: Props) {
  const { t } = useTranslation()
  const { tokens } = useSofiaTheme()
  const [selected, setSelected] = useState<number | null>(null)
  const [cashierName, setCashierName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleContinue = async () => {
    if (!selected) {
      Toast.show({ type: 'error', text1: t('registration.selectStore') || 'Select a store' })
      return
    }
    const store = stores.find((s) => s.id === selected)
    if (!store) return

    setLoading(true)
    try {
      await onNext(store.id, store.name, cashierName || 'Cashier')
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e.message || 'Registration failed' })
    } finally {
      setLoading(false)
    }
  }

  const primary = tokens.colors.primary

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tokens.colors.background.default }]}>
      <View style={styles.container}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <FontAwesome name="arrow-left" size={18} color={tokens.colors.text.secondary} />
        </Pressable>

        <Text style={[styles.stepLabel, { color: tokens.colors.text.muted }]}>
          {t('registration.step') || 'Step'} 2/4
        </Text>
        <Text style={[styles.title, { color: tokens.colors.text.primary }]}>
          {t('registration.selectStore') || 'Select Store'}
        </Text>

        <FlatList
          data={stores.filter((s) => s.is_active)}
          keyExtractor={(item) => String(item.id)}
          style={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.storeItem,
                { borderColor: selected === item.id ? primary[500] : tokens.colors.border.default },
                selected === item.id && { backgroundColor: primary[50] ?? '#f0f9ff' },
              ]}
              onPress={() => setSelected(item.id)}
            >
              <FontAwesome
                name={selected === item.id ? 'check-circle' : 'circle-o'}
                size={22}
                color={selected === item.id ? primary[600] : tokens.colors.text.muted}
              />
              <View style={styles.storeInfo}>
                <Text style={[styles.storeName, { color: tokens.colors.text.primary }]}>{item.name}</Text>
                <Text style={[styles.storeCode, { color: tokens.colors.text.muted }]}>{item.code}</Text>
              </View>
            </Pressable>
          )}
        />

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: tokens.colors.text.secondary }]}>
            {t('registration.cashierName') || 'Cashier Name (optional)'}
          </Text>
          <TextInput
            style={[styles.input, { borderColor: tokens.colors.border.default, color: tokens.colors.text.primary }]}
            value={cashierName}
            onChangeText={setCashierName}
            placeholder={t('registration.cashierNamePlaceholder') || 'e.g. Front Counter'}
            placeholderTextColor={tokens.colors.text.muted}
          />
        </View>

        <Pressable
          style={[styles.btn, { backgroundColor: primary[600], opacity: loading || !selected ? 0.6 : 1 }]}
          onPress={handleContinue}
          disabled={loading || !selected}
        >
          {loading ? <ActivityIndicator color="#fff" /> : (
            <Text style={styles.btnText}>{t('common.continue') || 'Continue'}</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: 24 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  stepLabel: { fontSize: 13, fontWeight: '500', marginTop: 8 },
  title: { fontSize: 26, fontWeight: '700', marginTop: 4, marginBottom: 16 },
  list: { flex: 1 },
  storeItem: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1.5, borderRadius: 12, padding: 16, marginBottom: 10 },
  storeInfo: { flex: 1 },
  storeName: { fontSize: 16, fontWeight: '600' },
  storeCode: { fontSize: 13, marginTop: 2 },
  inputGroup: { gap: 6, marginTop: 16 },
  label: { fontSize: 14, fontWeight: '500' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, height: 48, fontSize: 16 },
  btn: { height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
