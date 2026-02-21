import { View, Text, Pressable, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useSofiaTheme } from '@/theme/sofia-theme'

interface Props { onNext: () => void }

export default function WelcomeStep({ onNext }: Props) {
  const { t } = useTranslation()
  const { tokens } = useSofiaTheme()
  const primary = tokens.colors.primary

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: primary[500] }]}>
      <View style={styles.content}>
        <FontAwesome name="shopping-basket" size={64} color="#fff" style={styles.icon} />
        <Text style={styles.title}>
          Sofia<Text style={{ fontWeight: '800' }}>POS</Text>
        </Text>
        <Text style={styles.subtitle}>
          {t('registration.welcomeMessage') || 'Welcome! Let\'s set up your mobile point of sale.'}
        </Text>
      </View>
      <View style={styles.bottom}>
        <Pressable style={[styles.btn, { backgroundColor: '#fff' }]} onPress={onNext}>
          <Text style={[styles.btnText, { color: primary[600] }]}>
            {t('registration.getStarted') || 'Get Started'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  icon: { marginBottom: 24 },
  title: { fontSize: 36, fontWeight: '700', color: '#fff', marginBottom: 12 },
  subtitle: { fontSize: 17, color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 24 },
  bottom: { padding: 24 },
  btn: { height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 17, fontWeight: '600' },
})
