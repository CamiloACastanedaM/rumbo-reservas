import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Star } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../api.js'
import { useAuth } from '../auth.jsx'
import { formatAverage, reviewsLabel, Stars } from './Rating.jsx'

const date = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })

/** Reviews of one product. onRating tells the page the new average right after a review is posted. */
export default function Reviews({ productId, onRating }) {
  const { user } = useAuth()
  const location = useLocation()
  const [state, setState] = useState({ status: 'loading' })
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let alive = true
    setState({ status: 'loading' })
    api(`/products/${productId}/reviews`)
      .then((data) => alive && setState({ status: 'ok', data }))
      .catch((err) => alive && setState({ status: 'error', message: err.message }))
    return () => { alive = false }
  }, [productId, user?.email, retry])

  const posted = (data) => {
    setState({ status: 'ok', data })
    onRating(data.rating)
  }

  const data = state.data
  return (
    <section id="resenas" className="reviews-block" aria-labelledby="reviews-title">
      <h2 id="reviews-title">Reseñas</h2>
      {state.status === 'loading' && <div className="skeleton" aria-label="Cargando reseñas" />}
      {state.status === 'error' && (
        <div className="state" role="alert">
          <p>No pudimos cargar las reseñas en este momento.</p>
          <button type="button" className="btn btn-solid" onClick={() => setRetry((r) => r + 1)}>Reintentar</button>
        </div>
      )}
      {data && (
        <div className="reviews-layout">
          <div className="reviews-score">
            <strong className="score">{data.rating.count ? formatAverage(data.rating.average) : '–'}</strong>
            <Stars value={data.rating.average} size={20} />
            <span className="muted">{data.rating.count ? `Promedio de ${reviewsLabel(data.rating.count)}` : 'Aún nadie lo ha calificado'}</span>
            {data.canReview ? (
              <ReviewForm productId={productId} onPosted={posted} />
            ) : user ? (
              <p className="muted small">Podrás calificarlo cuando termines una estadía aquí.</p>
            ) : (
              <p className="muted small">
                ¿Te hospedaste aquí? <Link to="/iniciar-sesion" state={{ from: location.pathname, message: 'Inicia sesión para calificar tu estadía.' }}>Inicia sesión</Link> para calificar.
              </p>
            )}
          </div>
          {data.reviews.length === 0 ? (
            <p className="muted">Todavía no hay reseñas de este alojamiento.</p>
          ) : (
            <ul className="review-list">
              {data.reviews.map((r) => (
                <li key={r.id}>
                  <div className="review-head">
                    <span className="avatar avatar-sm" aria-hidden="true">{r.userName[0]}</span>
                    <strong>{r.userName}</strong>
                    <time dateTime={r.createdAt} className="muted">{date.format(new Date(r.createdAt))}</time>
                  </div>
                  <Stars value={r.rating} />
                  {r.comment && <p className="review-comment">{r.comment}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}

function ReviewForm({ productId, onPosted }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!rating) { setError('Elige de 1 a 5 estrellas.'); return }
    setSending(true)
    try {
      const data = await api(`/products/${productId}/reviews`, { method: 'POST', json: { rating, comment } })
      toast.success('¡Gracias! Tu reseña ya está publicada.')
      onPosted(data)
    } catch (err) {
      setError(err.fields?.rating ?? err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <form className="review-form" onSubmit={onSubmit} noValidate>
      <fieldset aria-describedby={error ? 'rating-error' : undefined}>
        <legend>Califica tu estadía</legend>
        <div className="star-picker">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} title={`${n} de 5`}>
              <input type="radio" name="rating" value={n} checked={rating === n} onChange={() => { setRating(n); setError(null) }} />
              <Star size={28} aria-hidden="true" fill={n <= rating ? 'currentColor' : 'none'} className={n <= rating ? 'on' : ''} />
              <span className="sr-only">{n} {n === 1 ? 'estrella' : 'estrellas'}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="field">
        <label htmlFor="review-comment">Cuéntanos tu experiencia <span className="hint">(opcional)</span></label>
        <textarea id="review-comment" rows={3} maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} />
      </div>
      {error && <p id="rating-error" className="error" role="alert">{error}</p>}
      <button type="submit" className="btn btn-solid" disabled={sending}>{sending ? 'Publicando…' : 'Publicar reseña'}</button>
    </form>
  )
}
