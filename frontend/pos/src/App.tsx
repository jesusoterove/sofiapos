import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { router } from './app/router'
import { queryClient } from './app/queryClient'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { SyncProvider } from './contexts/SyncContext'
import { OrderManagementProvider } from './contexts/OrderManagementContext'
import { ShiftProvider } from './contexts/ShiftContext'
import { UpdateProvider } from './contexts/UpdateContext'
import { loadCustomHooks } from './hooks-system/loader'
import { getRegistration } from './utils/registration'
import { isElectron, getAppVersion } from './utils/electron'
import { applyDefaultLanguageFromStore } from './utils/defaultLanguage'
import { useEffect, type ReactNode } from 'react'
import { ThemeProvider, MessageBoxProvider } from '@sofiapos/ui'
import '@sofiapos/ui/styles/theme.css'

// Load custom hooks
loadCustomHooks()


function SecuredApp() {
  const auth = useAuth()
  return <RouterProvider router={router} context={{ auth }} />
}

/**
 * Wraps providers that depend on a resolved authenticated user. Remounts when auth
 * finishes loading and when the logged-in user (or target store) changes so hooks
 * inside Sync / Shift / Order see up-to-date `useAuth()` state.
 */
function PostAuthProviders({ children }: { children: ReactNode }) {
  const { isLoading, user } = useAuth()
  const registration = getRegistration()
  const storeId = registration?.storeId ?? user?.store_id ?? 1

  const providerMountKey = isLoading
    ? 'auth-loading'
    : `auth-${user?.id ?? 'none'}-store-${storeId}`

  return (
    <UpdateProvider key={providerMountKey}>
      <SyncProvider>
        <ShiftProvider>
          <OrderManagementProvider storeId={storeId}>{children}</OrderManagementProvider>
        </ShiftProvider>
      </SyncProvider>
    </UpdateProvider>
  )
}

function App() {
  // Set app version in Electron
  useEffect(() => {
    if (isElectron) {
      getAppVersion().then(version => {
        console.log(`SofiaPOS v${version}`)
      }).catch(error => {
        console.error('Failed to get app version:', error)
      })
    }
  }, [])

  // Apply default_language from settings (IndexedDB) only when i18nextLng is not set (never overwrite existing)
  useEffect(() => {
    applyDefaultLanguageFromStore()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MessageBoxProvider>
          <AuthProvider>
            <PostAuthProviders>
              <SecuredApp />
              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
              />
            </PostAuthProviders>
          </AuthProvider>
        </MessageBoxProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App

