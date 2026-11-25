import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import App from './App.jsx'
import { AuthProvider } from './auth.jsx'
import { FavoritesProvider } from './favorites.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <FavoritesProvider>
          <App />
        </FavoritesProvider>
      </AuthProvider>
      <Toaster position="bottom-center" richColors closeButton />
    </BrowserRouter>
  </StrictMode>,
)
