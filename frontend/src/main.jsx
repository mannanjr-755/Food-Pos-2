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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
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
                    color: '#25211F',
                    border: '1px solid #E8D7C7',
                    borderRadius: '14px',
                    boxShadow: '0 12px 32px rgba(37, 33, 31, 0.10)',
                  },
                  success: { iconTheme: { primary: '#0E9F6E', secondary: '#FFFFFF' } },
                  error: { iconTheme: { primary: '#D92D20', secondary: '#FFFFFF' } },
                }}
              />
            </RealtimeProvider>
          </SearchProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
