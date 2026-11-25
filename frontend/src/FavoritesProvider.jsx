import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { api } from './api.js'
import { useAuth } from './auth.jsx'
import { FavoritesContext } from './favorites.jsx'

const byName = (a, b) => a.name.localeCompare(b.name, 'es')

/** One list of favorites for the whole app, so every heart and the «Mis favoritos» page stay in sync. */
export default function FavoritesProvider({ children }) {
  const { user } = useAuth()
  const email = user?.email
  // The list belongs to one account: after a sign-out or an account switch it reads as null (signed out or still loading).
  const [saved, setSaved] = useState({ email: null, list: null })
  const items = email && saved.email === email ? saved.list : null
  const setItems = (update) => setSaved((s) => {
    const cur = s.email === email ? s.list : null
    return { email, list: typeof update === 'function' ? update(cur) : update }
  })

  useEffect(() => {
    if (!email) return
    let alive = true
    // ?? : a heart tapped while this was loading already set the list; its toggle reloads it.
    const keep = (list) => alive && setSaved((s) => ({ email, list: (s.email === email ? s.list : null) ?? list }))
    api('/favorites').then(keep).catch(() => keep([]))
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
