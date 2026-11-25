import { Link, Navigate, useLocation } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useAuth } from '../auth.jsx'
import { useFavorites } from '../favorites.jsx'
import ProductCard from '../components/ProductCard.jsx'

/** Reads the shared favorites list, so a heart toggled anywhere shows up here at once. */
export default function Favorites() {
  const { user } = useAuth()
  const { items } = useFavorites()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/iniciar-sesion" replace
      state={{ from: location.pathname, message: 'Inicia sesión para ver tus alojamientos favoritos.' }} />
  }

  return (
    <section className="container page-section" aria-labelledby="fav-title">
      <div className="section-head">
        <div>
          <h1 id="fav-title" className="section-title">Mis favoritos</h1>
          {items?.length > 0 && (
            <p className="section-note">
              {items.length} {items.length === 1 ? 'alojamiento guardado' : 'alojamientos guardados'}. Toca el corazón para quitar uno de la lista.
            </p>
          )}
        </div>
      </div>
      {items === null ? (
        <div className="product-grid" aria-hidden="true">
          {Array.from({ length: 2 }, (_, i) => <div key={i} className="skeleton" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="state">
          <Heart size={32} aria-hidden="true" className="state-icon" />
          <p>Todavía no tienes favoritos.</p>
          <p className="muted">Toca el corazón de cualquier alojamiento para guardarlo aquí.</p>
          <Link to="/" className="btn btn-solid">Explorar alojamientos</Link>
        </div>
      ) : (
        <ul className="product-grid">
          {items.map((p, i) => <li key={p.id} style={{ '--i': i }}><ProductCard product={p} /></li>)}
        </ul>
      )}
    </section>
  )
}
