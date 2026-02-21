import { useState, useEffect, useMemo } from 'react'
import {
  View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import Toast from 'react-native-toast-message'

import { useSofiaTheme } from '@/theme/sofia-theme'
import { useShift } from '@/contexts/ShiftContext'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate, formatTime } from '@sofiapos/shared/utils'

export default function OpenShiftScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { tokens } = useSofiaTheme()
  const { openShift, isLoading, hasOpenShift } = useShift()
  const { user } = useAuth()
  const primary = tokens.colors.primary

  const [initialCash, setInitialCash] = useState('')
  const [notes, setNotes] = useState('')
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    if (hasOpenShift) {
      router.replace('/(tabs)')
    }
  }, [hasOpenShift])

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const dateTimeStr = useMemo(() => {
    return `${formatDate(now, { locale: 'es-ES', year: 'numeric', month: '2-digit', day: '2-digit' })} ${formatTime(now, { locale: 'es-ES', hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
  }, [now])

  const handleOpen = async () => {
    const cash = parseFloat(initialCash)
    if (isNaN(cash) || cash < 0) {
      Toast.show({ type: 'error', text1: t('shift.enterValidInitialCash') || 'Enter a valid initial cash amount' })
      return
    }
    try {
      await openShift({ initialCash: cash, notes: notes || undefined })
      Toast.show({ type: 'success', text1: t('shift.openShiftSuccess') || 'Shift opened!' })
      router.replace('/(tabs)')
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e.message || t('shift.openShiftFailed') || 'Failed to open shift' })
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tokens.colors.background.default }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <FontAwesome name="arrow-left" size={18} color={tokens.colors.text.secondary} />
          </Pressable>

          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: tokens.colors.text.primary }]}>
              {t('shift.openShift') || 'Open Shift'}
            </Text>
            <Text style={[styles.clock, { color: tokens.colors.text.muted }]}>{dateTimeStr}</Text>
          </View>

          <View style={[styles.card, { borderColor: tokens.colors.border.default, backgroundColor: tokens.colors.background.paper }]}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: tokens.colors.text.secondary }]}>
                {t('shift.cashier') || 'Cashier'}
              </Text>
              <Text style={[styles.valueText, { color: tokens.colors.text.primary }]}>
                {user?.full_name || user?.username || '—'}
              </Text>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: tokens.colors.text.secondary }]}>
                {t('shift.initialCash') || 'Initial Cash'}
              </Text>
              <TextInput
                style={[styles.input, { borderColor: tokens.colors.border.default, color: tokens.colors.text.primary }]}
                value={initialCash}
                onChangeText={setInitialCash}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={tokens.colors.text.muted}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: tokens.colors.text.secondary }]}>
                {t('shift.openingNotes') || 'Notes (optional)'}
              </Text>
              <TextInput
                style={[styles.textarea, { borderColor: tokens.colors.border.default, color: tokens.colors.text.primary }]}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholder={t('shift.notesPlaceholder') || 'Opening notes...'}
                placeholderTextColor={tokens.colors.text.muted}
              />
            </View>
          </View>

          <Pressable
            style={[styles.btn, { backgroundColor: primary[600], opacity: isLoading || !initialCash ? 0.6 : 1 }]}
            onPress={handleOpen}
            disabled={isLoading || !initialCash}
          >
            {isLoading ? <ActivityIndicator color="#fff" /> : (
              <Text style={styles.btnText}>{t('shift.confirmAndOpen') || 'Confirm & Open Shift'}</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flexGrow: 1, padding: 24, gap: 16 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700' },
  clock: { fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  card: { borderWidth: 1, borderRadius: 14, padding: 20, gap: 18 },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '500' },
  valueText: { fontSize: 16, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, height: 48, fontSize: 18, fontWeight: '600' },
  textarea: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, minHeight: 80 },
  btn: { height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
