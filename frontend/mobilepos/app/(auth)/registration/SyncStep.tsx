import { useState, useEffect, useRef } from 'react'
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useSofiaTheme } from '@/theme/sofia-theme'
import { performInitialSync, type SyncProgress } from '@/services/initialSync'

interface Props {
  storeId: number | null
  adminToken: string | null
  onNext: () => Promise<void>
  onBack: () => void
}

export default function SyncStep({ storeId, adminToken, onNext, onBack }: Props) {
  const { t } = useTranslation()
  const { tokens } = useSofiaTheme()
  const [progress, setProgress] = useState<SyncProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [done, setDone] = useState(false)
  const hasStarted = useRef(false)

  useEffect(() => {
    if (!hasStarted.current) {
      hasStarted.current = true
      startSync()
    }
  }, [])

  const startSync = async () => {
    setSyncing(true)
    setError(null)

    const result = await performInitialSync(
      (p) => setProgress(p),
      storeId ?? undefined,
      adminToken ?? undefined
    )

    setSyncing(false)
    if (result.success) {
      setDone(true)
    } else {
      setError(result.error || 'Sync failed')
    }
  }

  const primary = tokens.colors.primary

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tokens.colors.background.default }]}>
      <View style={styles.container}>
        <Pressable onPress={onBack} style={styles.backBtn} disabled={syncing}>
          <FontAwesome name="arrow-left" size={18} color={syncing ? tokens.colors.text.muted : tokens.colors.text.secondary} />
        </Pressable>

        <Text style={[styles.stepLabel, { color: tokens.colors.text.muted }]}>
          {t('registration.step') || 'Step'} 3/4
        </Text>
        <Text style={[styles.title, { color: tokens.colors.text.primary }]}>
          {t('registration.syncData') || 'Syncing Data'}
        </Text>

        <View style={styles.center}>
          {syncing && <ActivityIndicator size="large" color={primary[600]} />}
          {done && <FontAwesome name="check-circle" size={64} color="#22c55e" />}
          {error && <FontAwesome name="exclamation-circle" size={64} color="#ef4444" />}

          <Text style={[styles.progressMsg, { color: tokens.colors.text.secondary }]}>
            {progress?.message || (syncing ? 'Starting sync...' : error ? error : 'Sync complete!')}
          </Text>

          {progress && (
            <View style={[styles.progressBar, { backgroundColor: tokens.colors.border.light }]}>
              <View style={[styles.progressFill, { width: `${progress.progress}%`, backgroundColor: primary[500] }]} />
            </View>
          )}
        </View>

        {error && (
          <Pressable style={[styles.btn, { backgroundColor: primary[600] }]} onPress={startSync}>
            <Text style={styles.btnText}>{t('common.retry') || 'Retry'}</Text>
          </Pressable>
        )}
        {done && (
          <Pressable style={[styles.btn, { backgroundColor: primary[600] }]} onPress={onNext}>
            <Text style={styles.btnText}>{t('common.continue') || 'Continue'}</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: 24 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  stepLabel: { fontSize: 13, fontWeight: '500', marginTop: 8 },
  title: { fontSize: 26, fontWeight: '700', marginTop: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  progressMsg: { fontSize: 15, textAlign: 'center' },
  progressBar: { height: 6, borderRadius: 3, width: '80%', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  btn: { height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
