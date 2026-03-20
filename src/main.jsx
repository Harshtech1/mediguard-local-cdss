import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.jsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// If key is missing, render a clear error instead of a blank screen
if (!PUBLISHABLE_KEY) {
  createRoot(document.getElementById('root')).render(
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif',
      background: '#f8fafc', color: '#ef4444'
    }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⚠️ Configuration Error</h1>
      <p>Missing <code>VITE_CLERK_PUBLISHABLE_KEY</code> in your <code>.env</code> file.</p>
      <p style={{ color: '#64748b', marginTop: '0.5rem', fontSize: '0.875rem' }}>
        Add the key and restart the dev server.
      </p>
    </div>
  )
} else {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
        <App />
      </ClerkProvider>
    </StrictMode>
  )
}
