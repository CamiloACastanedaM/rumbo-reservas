import { Star } from 'lucide-react'

const one = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
export const reviewsLabel = (count) => `${count} ${count === 1 ? 'reseña' : 'reseñas'}`

/** Five stars, filled up to the rounded value. */
export function Stars({ value, size = 16 }) {
  const full = Math.round(value)
  return (
    <span className="stars" role="img" aria-label={`${full} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} aria-hidden="true" fill={n <= full ? 'currentColor' : 'none'} className={n <= full ? 'on' : ''} />
      ))}
    </span>
  )
}

/** «★ 4,5 · 12 reseñas», or a quiet note when nobody rated yet. */
export function RatingSummary({ rating }) {
  if (!rating?.count) return <span className="rating-summary is-empty">Sin reseñas aún</span>
  return (
    <span className="rating-summary">
      <Star size={16} aria-hidden="true" fill="currentColor" />
      <strong aria-label={`Puntuación media ${one.format(rating.average)} de 5`}>{one.format(rating.average)}</strong>
      <span>· {reviewsLabel(rating.count)}</span>
    </span>
  )
}

export const formatAverage = (n) => one.format(n)
