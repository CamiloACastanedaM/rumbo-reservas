import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { CalendarCheck, CircleCheck, Star, Luggage } from 'lucide-react'
import { countLabel, formatPrice, imageSrc } from '../api.js'
import { useAuth } from '../auth.jsx'
import useApi from '../components/useApi.js'
import { formatRange } from '../components/DateRangeCalendar.jsx'

const STATUS = { PROXIMA: 'Próxima', EN_CURSO: 'En curso', FINALIZADA: 'Finalizada' }
const bookedOn = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })

function useSignedIn(message) {
  const { user } = useAuth()
  const location = useLocation()
  const redirect = user ? null
    : <Navigate to="/iniciar-sesion" replace state={{ from: location.pathname, message }} />
  return { user, redirect }
}

/** One stay: lodging, stay dates, booking date, status and the optional data the guest left. */
function ReservationCard({ r }) {
  return (
    <article className="reservation-card">
      {r.product.mainImage && <img src={imageSrc(r.product.mainImage)} alt="" loading="lazy" />}
      <div className="reservation-body">
        <div className="reservation-top">
          <h2 className="reservation-title"><Link to={`/producto/${r.product.id}`}>{r.product.name}</Link></h2>
          <span className={`status status-${r.status.toLowerCase()}`}>{STATUS[r.status]}</span>
        </div>
        {r.product.city && <p className="muted">{r.product.city}</p>}
        <dl className="reservation-facts">
          <div><dt>Estadía</dt><dd>{formatRange(r.startDate, r.endDate)} · {countLabel(r.nights, 'noche', 'noches')}</dd></div>
          <div><dt>Huéspedes</dt><dd>{r.guests}</dd></div>
          {r.total != null && <div><dt>Total</dt><dd>{formatPrice(r.total)}</dd></div>}
          <div><dt>Reservada el</dt><dd>{bookedOn.format(new Date(r.createdAt))}</dd></div>
          {r.arrivalTime && <div><dt>Llegada aprox.</dt><dd>{r.arrivalTime.slice(0, 5)}</dd></div>}
          {r.phone && <div><dt>Teléfono</dt><dd>{r.phone}</dd></div>}
          {r.notes && <div className="wide"><dt>Notas</dt><dd>{r.notes}</dd></div>}
        </dl>
        {r.canReview && (
          <Link to={`/producto/${r.product.id}#resenas`} className="btn btn-ghost btn-sm btn-start">
            <Star size={16} aria-hidden="true" /> Calificar
          </Link>
        )}
      </div>
    </article>
  )
}

/** Shown right after booking. On a reload it finds the booking in the user's history. */
export function BookingDone() {
  const { id } = useParams()
  const location = useLocation()
  const { user, redirect } = useSignedIn('Inicia sesión para ver tu reserva.')
  const fresh = location.state?.reservation
  const history = useApi(fresh || !user ? null : '/reservations/me')
  if (redirect) return redirect
  const r = fresh ?? history.state.data?.find((x) => String(x.id) === id)

  return (
    <section className="container page-section booking-done" aria-labelledby="done-title">
      {r ? (
        <>
          <div className="done-head">
            <CircleCheck size={40} aria-hidden="true" className="done-icon" />
            <h1 id="done-title">¡Reserva confirmada!</h1>
            <p>Tu estadía quedó reservada. Te enviamos los detalles a <strong>{user.email}</strong>.</p>
          </div>
          <ReservationCard r={r} />
          <div className="done-actions">
            <Link to="/mis-reservas" className="btn btn-solid">Ver mis reservas</Link>
            <Link to="/" className="btn btn-ghost">Seguir explorando</Link>
          </div>
        </>
      ) : history.state.status === 'error' ? (
        <div className="state" role="alert"><p>{history.state.message}</p>
          <button type="button" className="btn btn-solid" onClick={history.retry}>Reintentar</button></div>
      ) : history.state.data ? (
        <div className="state"><p id="done-title">No encontramos esa reserva en tu cuenta.</p>
          <Link to="/mis-reservas" className="btn btn-solid">Ver mis reservas</Link></div>
      ) : <div className="skeleton skeleton-tall" aria-label="Cargando reserva" />}
    </section>
  )
}

/** «Mis reservas»: every stay of the user, latest first. */
export default function MyReservations() {
  const { user, redirect } = useSignedIn('Inicia sesión para ver tus reservas.')
  const { state, retry } = useApi(user ? '/reservations/me' : null)
  if (redirect) return redirect
  const list = state.data

  return (
    <section className="container page-section" aria-labelledby="res-title">
      <div className="section-head">
        <div>
          <h1 id="res-title" className="section-title">Mis reservas</h1>
          {list?.length > 0 && <p className="section-note">{countLabel(list.length, 'reserva', 'reservas')}, de la más reciente a la más antigua.</p>}
        </div>
      </div>
      {state.status === 'error' ? (
        <div className="state" role="alert">
          <p>{state.message}</p>
          <button type="button" className="btn btn-solid" onClick={retry}>Reintentar</button>
        </div>
      ) : !list ? (
        <div className="reservation-list" aria-hidden="true">
          {Array.from({ length: 2 }, (_, i) => <div key={i} className="skeleton" />)}
        </div>
      ) : list.length === 0 ? (
        <div className="state">
          <Luggage size={32} aria-hidden="true" className="state-icon" />
          <p>Todavía no tienes reservas.</p>
          <p className="muted">Busca un destino, elige tus fechas y reserva desde el detalle del alojamiento.</p>
          <Link to="/" className="btn btn-solid">Buscar alojamientos</Link>
        </div>
      ) : (
        <ul className="reservation-list">
          {list.map((r) => <li key={r.id}><ReservationCard r={r} /></li>)}
        </ul>
      )}
      <p className="muted small reservation-help"><CalendarCheck size={14} aria-hidden="true" /> Las estadías terminadas se pueden calificar desde aquí.</p>
    </section>
  )
}
