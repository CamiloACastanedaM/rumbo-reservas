import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, Share2 } from 'lucide-react'
import { api, formatPrice } from '../api.js'
import Gallery from '../components/Gallery.jsx'
import FeatureIcon from '../components/FeatureIcon.jsx'
import Availability from '../components/Availability.jsx'
import FavoriteButton from '../components/FavoriteButton.jsx'
import Reviews from '../components/Reviews.jsx'
import ShareDialog from '../components/ShareDialog.jsx'
import { RatingSummary } from '../components/Rating.jsx'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [state, setState] = useState({ status: 'loading' })
  const [sharing, setSharing] = useState(false)

  useEffect(() => {
    let alive = true
    setState({ status: 'loading' })
    api(`/products/${id}`)
      .then((product) => alive && setState({ status: 'ok', product }))
      .catch((err) => alive && setState({ status: 'error', message: err.message }))
    return () => { alive = false }
  }, [id])

  // Back to where the visitor came from; on a direct visit go home.
  const goBack = () => (location.key !== 'default' ? navigate(-1) : navigate('/'))

  if (state.status !== 'ok') {
    return (
      <div className="container detail-body">
        {state.status === 'loading' ? <div className="skeleton skeleton-tall" aria-label="Cargando" /> : (
          <div className="state" role="alert">
            <p>{state.message}</p>
            <Link to="/" className="btn btn-solid">Volver al inicio</Link>
          </div>
        )}
      </div>
    )
  }

  const { product } = state
  const price = formatPrice(product.pricePerNight)
  // Same shape as the home cards, so the favorites list can show it right away.
  const summary = {
    id: product.id, name: product.name, city: product.city, pricePerNight: product.pricePerNight,
    mainImage: product.images[0] ?? null, category: product.category?.title ?? null, rating: product.rating,
  }
  const setRating = (rating) => setState((s) => ({ ...s, product: { ...s.product, rating } }))
  return (
    <article>
      <header className="detail-head">
        <div className="container">
          <div>
            {product.city && <p className="map-label"><MapPin size={14} aria-hidden="true" />{product.city}</p>}
            <h1>{product.name}</h1>
          </div>
          <button type="button" className="back-link" onClick={goBack} aria-label="Volver">
            <ArrowLeft size={22} aria-hidden="true" />
          </button>
        </div>
      </header>
      <div className="container detail-body">
        <div className="detail-actions">
          <a href="#resenas" className="rating-link"><RatingSummary rating={product.rating} /></a>
          <div className="detail-buttons">
            <FavoriteButton product={summary} className="fav-inline" />
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSharing(true)}>
              <Share2 size={16} aria-hidden="true" /> Compartir
            </button>
          </div>
        </div>
        <Gallery images={product.images} name={product.name} />
        <div className="detail-info">
          <div className="detail-main">
            <section aria-labelledby="desc-title">
              <h2 id="desc-title">Sobre este alojamiento</h2>
              <p className="description">{product.description}</p>
            </section>
            <section className="features-block" aria-labelledby="features-title">
              <h2 id="features-title">Características</h2>
              {product.features.length === 0 ? (
                <p className="muted">Este alojamiento todavía no tiene características registradas.</p>
              ) : (
                <ul className="feature-list">
                  {product.features.map((f) => (
                    <li key={f.id}><span className="feature-chip"><FeatureIcon icon={f.icon} /></span>{f.name}</li>
                  ))}
                </ul>
              )}
            </section>
          </div>
          {(price || product.category) && (
            <aside className="price-panel" aria-label="Resumen">
              {product.category && <p className="map-label">{product.category.title}</p>}
              {price && <><strong>{price}</strong><span className="muted">por noche</span></>}
              {product.address && <p className="muted">{product.address}</p>}
            </aside>
          )}
        </div>
        <Availability productId={product.id} />
        <Reviews productId={product.id} onRating={setRating} />
        <section className="policies-block" aria-labelledby="policies-title">
          <h2 id="policies-title">Políticas del alojamiento</h2>
          {product.policies.length === 0 ? (
            <p className="muted">El anfitrión todavía no ha publicado sus políticas. Pregúntale antes de reservar.</p>
          ) : (
            <ul className="policy-list">
              {product.policies.map((x, i) => (
                <li key={i}>
                  <h3>{x.title}</h3>
                  <p>{x.description}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <ShareDialog open={sharing} onClose={() => setSharing(false)} product={product} />
    </article>
  )
}
