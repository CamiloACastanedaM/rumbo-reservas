import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext)

export const initials = (user) => `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
