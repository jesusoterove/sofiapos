import { PropsWithChildren, useEffect, useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import { View, StyleSheet } from 'react-native'
import Toast from 'react-native-toast-message'
import { queryClient } from '@/lib/query'
import { ensureI18n, i18n } from '@/lib/i18n'
import { SofiaThemeProvider } from '@/theme/sofia-theme'
import { AuthProvider } from '@/contexts/AuthContext'
import { ShiftProvider } from '@/contexts/ShiftContext'
import { initNetworkListener } from '@/utils/network'

export function AppProviders({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(i18n.isInitialized)

  useEffect(() => {
    const unsubscribe = initNetworkListener()
    return unsubscribe
  }, [])

  useEffect(() => {
    if (!ready) {
      ensureI18n().finally(() => setReady(true))
    }
  }, [ready])

  if (!ready) {
    return <View style={styles.loading} />
  }

  return (
    <SofiaThemeProvider>
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <AuthProvider>
            <ShiftProvider>
              {children}
              <Toast />
            </ShiftProvider>
          </AuthProvider>
        </I18nextProvider>
      </QueryClientProvider>
    </SofiaThemeProvider>
  )
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
