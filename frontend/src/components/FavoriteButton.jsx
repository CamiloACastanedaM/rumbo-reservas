import { useLocation, useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../auth.jsx'
import { useFavorites } from '../favorites.jsx'

/** Heart toggle. Signed-out visitors get an invitation to log in that brings them back here. */
export default function FavoriteButton({ product, className = '' }) {
  const { user } = useAuth()
  const { isFavorite, toggle } = useFavorites()
  const navigate = useNavigate()
  const location = useLocation()
  const on = isFavorite(product.id)

  const onClick = () => {
    if (!user) {
      toast('Inicia sesión para guardar alojamientos en tus favoritos.', {
        id: 'favorites-login',
        action: {
          label: 'Iniciar sesión',
          onClick: () => navigate('/iniciar-sesion', {
            state: { from: location.pathname + location.search, message: 'Inicia sesión para guardar tus alojamientos favoritos.' },
          }),
        },
      })
      return
    }
    toggle(product)
  }

  return (
    <button type="button" className={`fav-btn ${className}`} aria-pressed={on} onClick={onClick}
      aria-label={on ? `Quitar «${product.name}» de favoritos` : `Agregar «${product.name}» a favoritos`}
      title={on ? 'Quitar de favoritos' : 'Agregar a favoritos'}>
      <Heart size={20} aria-hidden="true" fill={on ? 'currentColor' : 'none'} />
    </button>
  )
}
