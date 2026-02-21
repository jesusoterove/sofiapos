import { useState } from 'react'
import {
  View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import Toast from 'react-native-toast-message'
import { useSofiaTheme } from '@/theme/sofia-theme'

interface Props {
  onNext: (username: string, password: string) => Promise<void>
  onBack: () => void
}

export default function CredentialsStep({ onNext, onBack }: Props) {
  const { t } = useTranslation()
  const { tokens } = useSofiaTheme()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!username || !password) {
      Toast.show({ type: 'error', text1: t('registration.enterCredentials') || 'Enter admin credentials' })
      return
    }
    setLoading(true)
    try {
      await onNext(username, password)
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e.message || 'Authentication failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tokens.colors.background.default }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Pressable onPress={onBack} style={styles.backBtn}>
            <FontAwesome name="arrow-left" size={18} color={tokens.colors.text.secondary} />
          </Pressable>

          <Text style={[styles.stepLabel, { color: tokens.colors.text.muted }]}>
            {t('registration.step') || 'Step'} 1/4
          </Text>
          <Text style={[styles.title, { color: tokens.colors.text.primary }]}>
            {t('registration.adminCredentials') || 'Admin Credentials'}
          </Text>
          <Text style={[styles.desc, { color: tokens.colors.text.secondary }]}>
            {t('registration.adminCredentialsDesc') || 'Enter admin credentials to register this device.'}
          </Text>

          <View style={styles.formGap}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: tokens.colors.text.secondary }]}>
                {t('auth.username') || 'Username'}
              </Text>
              <TextInput
                style={[styles.input, { borderColor: tokens.colors.border.default, color: tokens.colors.text.primary }]}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: tokens.colors.text.secondary }]}>
                {t('auth.password') || 'Password'}
              </Text>
              <View style={[styles.inputRow, { borderColor: tokens.colors.border.default }]}>
                <TextInput
                  style={[styles.inputFlex, { color: tokens.colors.text.primary }]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <FontAwesome name={showPassword ? 'eye-slash' : 'eye'} size={18} color={tokens.colors.text.muted} />
                </Pressable>
              </View>
            </View>
          </View>

          <Pressable
            style={[styles.btn, { backgroundColor: tokens.colors.primary[600], opacity: loading || !username || !password ? 0.6 : 1 }]}
            onPress={handleSubmit}
            disabled={loading || !username || !password}
          >
            {loading ? <ActivityIndicator color="#fff" /> : (
              <Text style={styles.btnText}>{t('common.continue') || 'Continue'}</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flexGrow: 1, padding: 24, gap: 8 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  stepLabel: { fontSize: 13, fontWeight: '500', marginTop: 12 },
  title: { fontSize: 26, fontWeight: '700', marginTop: 4 },
  desc: { fontSize: 15, marginTop: 4, lineHeight: 22 },
  formGap: { gap: 16, marginTop: 24 },
  inputGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: '500' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, height: 48, fontSize: 16 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, height: 48 },
  inputFlex: { flex: 1, fontSize: 16, height: '100%' },
  eyeBtn: { padding: 6 },
  btn: { height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
