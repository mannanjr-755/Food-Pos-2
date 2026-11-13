import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { SettingsProvider } from './contexts/SettingsContext'
import { SearchProvider } from './contexts/SearchContext'
import { RealtimeProvider } from './contexts/RealtimeContext'
import { OfflineProvider } from './contexts/OfflineContext'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <OfflineProvider>
          <SettingsProvider>
            <SearchProvider>
              <RealtimeProvider>
                <App />
                <Toaster
                  position="top-right"
                  toastOptions={{
                    style: {
                      fontFamily: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
                      fontSize: '14px',
                      background: '#FFFFFF',
                      color: '#122018',
                      border: '1px solid #D7E5DC',
                      borderRadius: '14px',
                      boxShadow: '0 12px 32px rgba(18, 32, 24, 0.10)',
                    },
                    success: { iconTheme: { primary: '#0F5C3A', secondary: '#FFFFFF' } },
                    error: { iconTheme: { primary: '#D92D20', secondary: '#FFFFFF' } },
                  }}
                />
              </RealtimeProvider>
            </SearchProvider>
          </SettingsProvider>
        </OfflineProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
