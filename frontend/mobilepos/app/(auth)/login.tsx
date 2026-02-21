import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, Pressable, KeyboardAvoidingView,
  Platform, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import FontAwesome from '@expo/vector-icons/FontAwesome'

import { useAuth } from '@/contexts/AuthContext'
import { useSofiaTheme } from '@/theme/sofia-theme'
import { isOnline as checkOnline, subscribeToNetwork } from '@/utils/network'

export default function LoginScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { login, loginOffline, hasLocalPassword } = useAuth()
  const { tokens } = useSofiaTheme()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [online, setOnline] = useState(true)
  const [showOfflineLogin, setShowOfflineLogin] = useState(false)

  useEffect(() => {
    checkOnline().then(setOnline)
    const unsubscribe = subscribeToNetwork(setOnline)
    return unsubscribe
  }, [])

  useEffect(() => {
    if (!online && hasLocalPassword) {
      setShowOfflineLogin(true)
    }
  }, [online, hasLocalPassword])

  const handleOnlineLogin = async () => {
    if (!username || !password) {
      Toast.show({ type: 'error', text1: t('auth.loginRequired') || 'Please enter username and password' })
      return
    }
    if (!online) {
      Toast.show({ type: 'error', text1: t('auth.mustBeOnlineForInitialLogin') || 'Must be online for initial login' })
      return
    }

    setIsLoading(true)
    try {
      await login(username, password)
      Toast.show({ type: 'success', text1: t('auth.loginSuccess') || 'Login successful!' })
      router.replace('/(tabs)')
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error.message || t('auth.loginError') || 'Login failed' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOfflineLogin = async () => {
    if (!password) {
      Toast.show({ type: 'error', text1: t('auth.enterLocalPassword') || 'Please enter your local password' })
      return
    }

    setIsLoading(true)
    try {
      const success = await loginOffline(password)
      if (success) {
        Toast.show({ type: 'success', text1: t('auth.offlineLoginSuccess') || 'Offline login successful!' })
        router.replace('/(tabs)')
      } else {
        Toast.show({ type: 'error', text1: t('auth.invalidLocalPassword') || 'Invalid local password' })
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error.message || t('auth.offlineLoginFailed') || 'Offline login failed' })
    } finally {
      setIsLoading(false)
    }
  }

  const primary500 = tokens.colors.primary[500]
  const primary600 = tokens.colors.primary[600]

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: primary500 }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: primary600 }]}>
              <Text style={styles.headerTitle}>{t('auth.welcome') || 'Welcome!'}</Text>
              <Text style={styles.headerSubtitle}>{t('auth.signInToContinue') || 'Sign in to continue'}</Text>
              <View style={styles.statusRow}>
                <FontAwesome
                  name={online ? 'wifi' : 'ban'}
                  size={14}
                  color={online ? '#bbf7d0' : '#fde68a'}
                />
                <Text style={[styles.statusText, { color: online ? '#bbf7d0' : '#fde68a' }]}>
                  {online ? (t('auth.online') || 'Online') : (t('auth.offline') || 'Offline')}
                </Text>
              </View>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {showOfflineLogin && !online ? (
                <>
                  <View style={styles.offlineBanner}>
                    <Text style={styles.offlineBannerText}>
                      {t('auth.offlineUseLocalPassword') || 'You are offline. Use your local password to continue.'}
                    </Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: tokens.colors.text.secondary }]}>
                      {t('auth.localPassword') || 'Local Password'}
                    </Text>
                    <View style={[styles.inputRow, { borderColor: tokens.colors.border.default }]}>
                      <TextInput
                        style={[styles.input, { color: tokens.colors.text.primary }]}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        editable={!isLoading}
                        placeholderTextColor={tokens.colors.text.muted}
                      />
                      <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                        <FontAwesome name={showPassword ? 'eye-slash' : 'eye'} size={18} color={tokens.colors.text.muted} />
                      </Pressable>
                    </View>
                  </View>

                  <Pressable
                    style={[styles.btn, { backgroundColor: primary600, opacity: isLoading || !password ? 0.6 : 1 }]}
                    onPress={handleOfflineLogin}
                    disabled={isLoading || !password}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.btnText}>{t('auth.loginOffline') || 'Login Offline'}</Text>
                    )}
                  </Pressable>
                </>
              ) : (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: tokens.colors.text.secondary }]}>
                      {t('auth.username') || 'Username'}
                    </Text>
                    <View style={[styles.inputRow, { borderColor: tokens.colors.border.default }]}>
                      <TextInput
                        style={[styles.input, { color: tokens.colors.text.primary }]}
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!isLoading && online}
                        placeholderTextColor={tokens.colors.text.muted}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: tokens.colors.text.secondary }]}>
                      {t('auth.password') || 'Password'}
                    </Text>
                    <View style={[styles.inputRow, { borderColor: tokens.colors.border.default }]}>
                      <TextInput
                        style={[styles.input, { color: tokens.colors.text.primary }]}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        editable={!isLoading && online}
                        placeholderTextColor={tokens.colors.text.muted}
                      />
                      <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                        <FontAwesome name={showPassword ? 'eye-slash' : 'eye'} size={18} color={tokens.colors.text.muted} />
                      </Pressable>
                    </View>
                  </View>

                  {!online && (
                    <View style={styles.errorBanner}>
                      <Text style={styles.errorBannerText}>
                        {t('auth.offlineConnectToLogin') || 'You are offline. Please connect to the internet to login.'}
                      </Text>
                    </View>
                  )}

                  <Pressable
                    style={[styles.btn, { backgroundColor: primary600, opacity: isLoading || !online || !username || !password ? 0.6 : 1 }]}
                    onPress={handleOnlineLogin}
                    disabled={isLoading || !online || !username || !password}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.btnText}>{t('auth.login') || 'Login'}</Text>
                    )}
                  </Pressable>
                </>
              )}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={[styles.brand, { color: tokens.colors.text.primary }]}>
                Sofia<Text style={{ color: primary600 }}>POS</Text>
              </Text>
              <Text style={[styles.footerSub, { color: tokens.colors.text.muted }]}>
                {t('auth.pointOfSale') || 'Point of Sale'}
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 },
  header: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 28 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 4 },
  headerSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.9)' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  statusText: { fontSize: 13 },
  form: { padding: 24, gap: 16 },
  inputGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: '500' },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, height: 48 },
  input: { flex: 1, fontSize: 16, height: '100%' },
  eyeBtn: { padding: 6 },
  btn: { height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  offlineBanner: { backgroundColor: '#fefce8', borderWidth: 1, borderColor: '#fde68a', borderRadius: 10, padding: 14 },
  offlineBannerText: { color: '#854d0e', fontSize: 13 },
  errorBanner: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 10, padding: 14 },
  errorBannerText: { color: '#991b1b', fontSize: 13 },
  footer: { alignItems: 'center', paddingBottom: 20 },
  brand: { fontSize: 18, fontWeight: '700' },
  footerSub: { fontSize: 13, marginTop: 2 },
})
