import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './i18n' // Initialize i18n (reads i18nextLng only; never writes on start)
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

