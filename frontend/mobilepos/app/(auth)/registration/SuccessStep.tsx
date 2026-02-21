import { View, Text, Pressable, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useSofiaTheme } from '@/theme/sofia-theme'

interface Props {
  storeName: string
  cashierName: string
  onStart: () => void
}

export default function SuccessStep({ storeName, cashierName, onStart }: Props) {
  const { t } = useTranslation()
  const { tokens } = useSofiaTheme()
  const primary = tokens.colors.primary

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: primary[500] }]}>
      <View style={styles.content}>
        <FontAwesome name="check-circle" size={80} color="#fff" />
        <Text style={styles.title}>
          {t('registration.setupComplete') || 'Setup Complete!'}
        </Text>
        <Text style={styles.subtitle}>
          {storeName}
          {cashierName ? ` — ${cashierName}` : ''}
        </Text>
        <Text style={styles.desc}>
          {t('registration.readyToUse') || 'Your mobile POS is ready. Log in to start selling.'}
        </Text>
      </View>
      <View style={styles.bottom}>
        <Pressable style={[styles.btn, { backgroundColor: '#fff' }]} onPress={onStart}>
          <Text style={[styles.btnText, { color: primary[600] }]}>
            {t('registration.goToLogin') || 'Go to Login'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  title: { fontSize: 30, fontWeight: '700', color: '#fff', marginTop: 16 },
  subtitle: { fontSize: 17, color: 'rgba(255,255,255,0.9)', fontWeight: '500' },
  desc: { fontSize: 15, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 22 },
  bottom: { padding: 24 },
  btn: { height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 17, fontWeight: '600' },
})
