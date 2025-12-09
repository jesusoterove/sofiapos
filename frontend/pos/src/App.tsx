import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { router } from './app/router'
import { queryClient } from './app/queryClient'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { SyncProvider } from './contexts/SyncContext'
import { loadCustomHooks } from './hooks-system/loader'
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

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MessageBoxProvider>
          <AuthProvider>
            <SyncProvider>
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
            </SyncProvider>
          </AuthProvider>
        </MessageBoxProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App

