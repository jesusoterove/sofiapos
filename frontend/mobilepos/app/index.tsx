import { useEffect, useState } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { isRegistered } from '@/utils/registration'
import { useSofiaTheme } from '@/theme/sofia-theme'

export default function IndexScreen() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  const { tokens } = useSofiaTheme()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (isLoading) return

    ;(async () => {
      const registered = await isRegistered()

      if (!registered) {
        router.replace('/(auth)/registration')
      } else if (!isAuthenticated) {
        router.replace('/(auth)/login')
      } else {
        router.replace('/(tabs)')
      }
      setChecking(false)
    })()
  }, [isLoading, isAuthenticated])

  if (isLoading || checking) {
    return (
      <View style={[styles.center, { backgroundColor: tokens.colors.background.default }]}>
        <ActivityIndicator size="large" color={tokens.colors.primary[600]} />
      </View>
    )
  }

  return null
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
})
