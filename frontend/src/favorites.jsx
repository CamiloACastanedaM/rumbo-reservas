import { createContext, useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { api } from './api.js'
import { useAuth } from './auth.jsx'

const FavoritesContext = createContext(null)
const byName = (a, b) => a.name.localeCompare(b.name, 'es')

/** One list of favorites for the whole app, so every heart and the «Mis favoritos» page stay in sync. */
export function FavoritesProvider({ children }) {
  const { user } = useAuth()
  const [items, setItems] = useState(null) // null = signed out or still loading
  const email = user?.email

  useEffect(() => {
    setItems(null)
    if (!email) return
    let alive = true
    // ?? : a heart tapped while this was loading already set the list; its toggle reloads it.
    api('/favorites').then((list) => alive && setItems((cur) => cur ?? list)).catch(() => alive && setItems((cur) => cur ?? []))
    return () => { alive = false }
  }, [email])

  const isFavorite = (id) => !!items?.some((p) => p.id === id)

  /** Optimistic: the heart changes at once and goes back if the server says no. */
  const toggle = async (product) => {
    const was = isFavorite(product.id)
    const loading = items === null
    const without = (list) => (list ?? []).filter((p) => p.id !== product.id)
    const withIt = (list) => [...without(list), product].sort(byName)
    setItems(was ? without : withIt)
    try {
      await api(`/favorites/${product.id}`, { method: was ? 'DELETE' : 'POST' })
      if (loading) setItems(await api('/favorites'))
    } catch (e) {
      setItems(was ? withIt : without)
      toast.error(e.message)
    }
  }

  return <FavoritesContext.Provider value={{ items, isFavorite, toggle }}>{children}</FavoritesContext.Provider>
}

export const useFavorites = () => useContext(FavoritesContext)
