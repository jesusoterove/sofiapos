import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { router } from './app/router'
import { queryClient } from './app/queryClient'
import { loadCustomHooks } from './hooks-system/loader'
import { isElectron, getAppVersion } from './utils/electron'
import { useEffect } from 'react'

// Load custom hooks
loadCustomHooks()

// Set app version in Electron
if (isElectron) {
  useEffect(() => {
    getAppVersion().then(version => {
      console.log(`SofiaPOS v${version}`)
    })
  }, [])
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  )
}

export default App

