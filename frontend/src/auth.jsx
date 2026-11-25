import { createContext, useContext, useEffect, useState } from 'react'
import { api, readSession, writeSession } from './api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession)

  useEffect(() => {
    // Follows logins/logouts from api(), other components and other tabs.
    const sync = () => setSession(readSession())
    window.addEventListener('rumbo:session', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('rumbo:session', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  useEffect(() => {
    // Refresh name and role on load: an admin whose role was revoked loses the admin UI.
    if (!readSession()?.token) return
    api('/users/me').then((user) => {
      const current = readSession()
      if (current) writeSession({ ...current, user })
    }).catch(() => {})
  }, [])

  const value = {
    user: session?.user ?? null,
    isAdmin: session?.user?.role === 'ADMIN',
    login: (newSession) => writeSession(newSession),
    logout: () => writeSession(null),
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

export const initials = (user) => `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
