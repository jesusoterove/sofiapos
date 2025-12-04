import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { router } from './app/router'
import { queryClient } from './app/queryClient'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from '@sofiapos/ui'
// Styles are automatically imported from @sofiapos/ui
import { loadCustomHooks } from './hooks-system/loader'

// Load custom hooks
loadCustomHooks()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
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
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App

