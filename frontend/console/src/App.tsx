import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { router } from './app/router'
import { queryClient } from './app/queryClient'
import { AuthProvider } from './contexts/AuthContext'
import { SettingsProvider } from './contexts/SettingsContext'
import { ThemeProvider, LanguageProvider, MessageBoxProvider } from '@sofiapos/ui'
// Styles are automatically imported from @sofiapos/ui
import { loadCustomHooks } from './hooks-system/loader'
import { useTranslation } from './i18n/hooks'

// Load custom hooks
loadCustomHooks()

function AppContent() {
  const { currentLanguage, changeLanguage } = useTranslation()
  
  return (
    <LanguageProvider language={currentLanguage} changeLanguage={changeLanguage}>
      <SettingsProvider>
        <AuthProvider>
          <RouterProvider router={router} />
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
        </AuthProvider>
      </SettingsProvider>
    </LanguageProvider>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MessageBoxProvider>
          <AppContent />
        </MessageBoxProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App

