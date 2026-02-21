import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, Pressable, StyleSheet, ScrollView, Switch, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import Toast from 'react-native-toast-message'
import * as Device from 'expo-device'
import * as Application from 'expo-application'

import { useSofiaTheme } from '@/theme/sofia-theme'
import { useAuth } from '@/contexts/AuthContext'
import { useShift } from '@/contexts/ShiftContext'
import { i18n } from '@/lib/i18n'
import { openDatabase, getSyncQueueCount } from '@/db'
import { getRegistration, clearRegistration, type RegistrationData } from '@/utils/registration'
import { getHardwareId } from '@/utils/hardwareId'
import { isOnline } from '@/utils/network'
import { performInitialSync } from '@/services/initialSync'

export default function SettingsScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { tokens } = useSofiaTheme()
  const { user, logout } = useAuth()
  const { hasOpenShift, currentShift } = useShift()
  const primary = tokens.colors.primary

  const [lang, setLang] = useState(i18n.language || 'en')
  const [syncing, setSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [online, setOnline] = useState(true)
  const [reg, setReg] = useState<RegistrationData | null>(null)
  const [hwId, setHwId] = useState('')

  useEffect(() => {
    ;(async () => {
      setOnline(await isOnline())
      const db = await openDatabase()
      setPendingCount(await getSyncQueueCount(db))
      setReg(await getRegistration())
      setHwId(await getHardwareId())
    })()
  }, [])

  const toggleLang = useCallback(() => {
    const next = lang === 'en' ? 'es' : 'en'
    i18n.changeLanguage(next)
    setLang(next)
  }, [lang])

  const handleManualSync = useCallback(async () => {
    setSyncing(true)
    try {
      await performInitialSync(undefined, reg?.storeId)
      const db = await openDatabase()
      setPendingCount(await getSyncQueueCount(db))
      Toast.show({ type: 'success', text1: t('settings.syncComplete') || 'Sync complete' })
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e.message || 'Sync failed' })
    } finally {
      setSyncing(false)
    }
  }, [reg, t])

  const handleLogout = useCallback(async () => {
    await logout()
    router.replace('/(auth)/login')
  }, [logout, router])

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: tokens.colors.text.muted }]}>{title}</Text>
      <View style={[styles.sectionCard, { borderColor: tokens.colors.border.default, backgroundColor: tokens.colors.background.paper }]}>
        {children}
      </View>
    </View>
  )

  const Row = ({ icon, label, right, onPress, danger }: { icon: string; label: string; right?: React.ReactNode; onPress?: () => void; danger?: boolean }) => (
    <Pressable style={[styles.row, { borderColor: tokens.colors.border.light }]} onPress={onPress} disabled={!onPress}>
      <FontAwesome name={icon as any} size={16} color={danger ? '#ef4444' : tokens.colors.text.secondary} style={styles.rowIcon} />
      <Text style={[styles.rowLabel, { color: danger ? '#ef4444' : tokens.colors.text.primary }]}>{label}</Text>
      {right || (onPress && <FontAwesome name="chevron-right" size={12} color={tokens.colors.text.muted} />)}
    </Pressable>
  )

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tokens.colors.background.default }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: tokens.colors.text.primary }]}>
          {t('settings.title') || 'Settings'}
        </Text>

        {/* Shift */}
        <Section title={t('settings.shift') || 'Shift'}>
          {hasOpenShift ? (
            <>
              <Row icon="clock-o" label={`${t('shift.shiftNumber') || 'Shift'}: ${currentShift?.shift_number ?? ''}`} />
              <Row icon="lock" label={t('shift.closeShift') || 'Close Shift'} onPress={() => router.push('/shift/close')} danger />
            </>
          ) : (
            <Row icon="unlock" label={t('shift.openShift') || 'Open Shift'} onPress={() => router.push('/shift/open')} />
          )}
        </Section>

        {/* Language */}
        <Section title={t('settings.language') || 'Language'}>
          <Row
            icon="globe"
            label={lang === 'en' ? 'English' : 'Español'}
            right={<Switch value={lang === 'es'} onValueChange={toggleLang} trackColor={{ true: primary[500] }} />}
          />
        </Section>

        {/* Sync */}
        <Section title={t('settings.sync') || 'Sync'}>
          <Row icon={online ? 'wifi' : 'ban'} label={online ? (t('auth.online') || 'Online') : (t('auth.offline') || 'Offline')} right={
            <View style={[styles.statusDot, { backgroundColor: online ? '#22c55e' : '#ef4444' }]} />
          } />
          <Row icon="cloud-upload" label={`${t('settings.pendingSync') || 'Pending sync'}: ${pendingCount}`} />
          <Row
            icon="refresh"
            label={syncing ? (t('common.loading') || 'Syncing...') : (t('settings.manualSync') || 'Sync Now')}
            onPress={syncing ? undefined : handleManualSync}
            right={syncing ? <ActivityIndicator size="small" color={primary[500]} /> : undefined}
          />
        </Section>

        {/* Device */}
        <Section title={t('settings.device') || 'Device'}>
          <Row icon="mobile" label={`${Device.modelName ?? 'Unknown'} · ${Device.osName} ${Device.osVersion}`} />
          <Row icon="tag" label={`${t('settings.hardwareId') || 'Hardware ID'}: ${hwId.substring(0, 20)}...`} />
          <Row icon="building" label={`${t('settings.store') || 'Store'}: ${reg?.storeName ?? '—'}`} />
          <Row icon="info-circle" label={`v${Application.nativeApplicationVersion ?? '1.0.0'}`} />
        </Section>

        {/* Account */}
        <Section title={t('settings.account') || 'Account'}>
          <Row icon="user" label={user?.full_name || user?.username || '—'} />
          <Row icon="sign-out" label={t('settings.logout') || 'Logout'} onPress={handleLogout} danger />
        </Section>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, gap: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700' },
  section: { gap: 6 },
  sectionTitle: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', paddingLeft: 4 },
  sectionCard: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  rowIcon: { width: 24, textAlign: 'center' },
  rowLabel: { flex: 1, fontSize: 15, marginLeft: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
})
