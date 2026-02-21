import { useState } from 'react'
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
import { formatCurrency } from '@sofiapos/shared/utils'

export default function CloseShiftScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { tokens } = useSofiaTheme()
  const { currentShift, closeShift, isLoading } = useShift()
  const primary = tokens.colors.primary

  const [notes, setNotes] = useState('')

  const handleClose = async () => {
    try {
      await closeShift({ notes: notes || undefined })
      Toast.show({ type: 'success', text1: t('shift.closeShiftSuccess') || 'Shift closed!' })
      router.replace('/(tabs)')
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e.message || t('shift.closeShiftFailed') || 'Failed to close shift' })
    }
  }

  if (!currentShift) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: tokens.colors.background.default }]}>
        <View style={styles.center}>
          <Text style={[styles.noShiftText, { color: tokens.colors.text.muted }]}>
            {t('shift.noOpenShift') || 'No open shift'}
          </Text>
          <Pressable style={[styles.btnSecondary, { borderColor: tokens.colors.border.default }]} onPress={() => router.back()}>
            <Text style={[styles.btnSecondaryText, { color: tokens.colors.text.secondary }]}>
              {t('common.back') || 'Back'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tokens.colors.background.default }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <FontAwesome name="arrow-left" size={18} color={tokens.colors.text.secondary} />
          </Pressable>

          <Text style={[styles.title, { color: tokens.colors.text.primary }]}>
            {t('shift.closeShift') || 'Close Shift'}
          </Text>

          <View style={[styles.card, { borderColor: tokens.colors.border.default, backgroundColor: tokens.colors.background.paper }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: tokens.colors.text.muted }]}>
                {t('shift.shiftNumber') || 'Shift #'}
              </Text>
              <Text style={[styles.infoValue, { color: tokens.colors.text.primary }]}>
                {currentShift.shift_number}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: tokens.colors.text.muted }]}>
                {t('shift.openedAt') || 'Opened'}
              </Text>
              <Text style={[styles.infoValue, { color: tokens.colors.text.primary }]}>
                {new Date(currentShift.opened_at).toLocaleString()}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: tokens.colors.text.muted }]}>
                {t('shift.initialCash') || 'Initial Cash'}
              </Text>
              <Text style={[styles.infoValue, { color: tokens.colors.text.primary }]}>
                {formatCurrency(currentShift.initial_cash ?? 0)}
              </Text>
            </View>
          </View>

          <View style={[styles.card, { borderColor: tokens.colors.border.default, backgroundColor: tokens.colors.background.paper }]}>
            <Text style={[styles.label, { color: tokens.colors.text.secondary }]}>
              {t('shift.closingNotes') || 'Closing Notes (optional)'}
            </Text>
            <TextInput
              style={[styles.textarea, { borderColor: tokens.colors.border.default, color: tokens.colors.text.primary }]}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholder={t('shift.closingNotesPlaceholder') || 'Any notes for this shift...'}
              placeholderTextColor={tokens.colors.text.muted}
            />
          </View>

          <Pressable
            style={[styles.btnDanger, { opacity: isLoading ? 0.6 : 1 }]}
            onPress={handleClose}
            disabled={isLoading}
          >
            {isLoading ? <ActivityIndicator color="#fff" /> : (
              <>
                <FontAwesome name="lock" size={16} color="#fff" />
                <Text style={styles.btnDangerText}>{t('shift.confirmAndClose') || 'Close Shift'}</Text>
              </>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  noShiftText: { fontSize: 16 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700' },
  card: { borderWidth: 1, borderRadius: 14, padding: 20, gap: 14 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: 14 },
  infoValue: { fontSize: 15, fontWeight: '600' },
  label: { fontSize: 14, fontWeight: '500' },
  textarea: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, minHeight: 100 },
  btnDanger: { height: 52, borderRadius: 12, backgroundColor: '#ef4444', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnDangerText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  btnSecondary: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  btnSecondaryText: { fontSize: 14, fontWeight: '500' },
})
