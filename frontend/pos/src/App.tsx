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
import { loadCustomHooks } from './hooks-system/loader'
import { getRegistration } from './utils/registration'
import { isElectron, getAppVersion } from './utils/electron'
import { useEffect } from 'react'
import { ThemeProvider, MessageBoxProvider } from '@sofiapos/ui'
import '@sofiapos/ui/styles/theme.css'

// Load custom hooks
loadCustomHooks()


function SecuredApp() {
  const auth = useAuth()
  return <RouterProvider router={router} context={{ auth }} />
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

  // Get store ID from registration
  const registration = getRegistration()
  const storeId = registration?.storeId || 1 // Fallback to 1 if not registered yet

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MessageBoxProvider>
          <AuthProvider>
            <SyncProvider>
              <ShiftProvider>
                <OrderManagementProvider storeId={storeId}>
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
                </OrderManagementProvider>
              </ShiftProvider>
            </SyncProvider>
          </AuthProvider>
        </MessageBoxProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App

