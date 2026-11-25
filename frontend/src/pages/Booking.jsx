import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, MapPin } from 'lucide-react'
import { api, countLabel, formatPrice } from '../api.js'
import { useAuth } from '../auth.jsx'
import useApi from '../components/useApi.js'
import Gallery from '../components/Gallery.jsx'
import FeatureIcon from '../components/FeatureIcon.jsx'
import DateRangeCalendar, { formatRange, formatShort, toIso } from '../components/DateRangeCalendar.jsx'

export const LOGIN_TO_BOOK = 'Debes iniciar sesión para reservar. Si no tienes cuenta, regístrate: toma menos de un minuto.'

const nightsBetween = (start, end) => Math.round((new Date(end) - new Date(start)) / 86400000)

/** Booking page: the lodging, who books, the dates and the optional data, then «Confirmar reserva». */
export default function Booking() {
  const { id } = useParams()
  const { user } = useAuth()
  const location = useLocation()
  if (!user) {
    return <Navigate to="/iniciar-sesion" replace state={{ from: location.pathname + location.search, message: LOGIN_TO_BOOK }} />
  }
  return <BookingForm id={id} user={user} />
}

function BookingForm({ id, user }) {
  const navigate = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const product = useApi(`/products/${id}`)
  const booked = useApi(`/products/${id}/availability`)
  const [picked, setDates] = useState(() => {
    const start = params.get('llegada'), end = params.get('salida')
    return start && end && start >= toIso(new Date()) && end > start ? { start, end } : { start: null, end: null }
  })
  const [values, setValues] = useState({ guests: 1, phone: '', arrivalTime: '', notes: '' })
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(false)

  const takenIn = (start, end) => (booked.state.data ?? []).some((r) => r.start < end && r.end > start)
  // Dates from a link that turn out to be taken are ignored once the calendar data arrives.
  const dates = picked.end && takenIn(picked.start, picked.end) ? { start: null, end: null } : picked
  const clearErrors = (...keys) => setErrors((e) => {
    const next = { ...e }
    keys.forEach((k) => delete next[k])
    return next
  })

  if (product.state.status === 'error') {
    return (
      <div className="container detail-body">
        <div className="state" role="alert">
          <p>{product.state.message}</p>
          <Link to="/" className="btn btn-solid">Volver al inicio</Link>
        </div>
      </div>
    )
  }
  if (!product.state.data) {
    return <div className="container detail-body"><div className="skeleton skeleton-tall" aria-label="Cargando" /></div>
  }

  const p = product.state.data
  const nights = dates.end ? nightsBetween(dates.start, dates.end) : 0
  const total = nights && p.pricePerNight != null ? formatPrice(p.pricePerNight * nights) : null

  const pickDates = (range) => {
    if (range.end && takenIn(range.start, range.end)) {
      setDates({ start: range.start, end: null })
      setErrors((e) => ({ ...e, dates: 'Ese rango incluye días ocupados (tachados). Elige una salida antes del primer día ocupado o cambia la llegada.' }))
      return
    }
    setDates(range)
    clearErrors('dates', 'form')
  }

  const set = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }))
    clearErrors(field)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!dates.start || !dates.end) {
      setErrors((x) => ({ ...x, dates: !dates.start ? 'Elige en el calendario el día de llegada y el de salida.' : 'Ahora elige el día de salida.' }))
      document.getElementById('booking-dates')?.focus()
      return
    }
    setSending(true)
    try {
      const reservation = await api('/reservations', {
        method: 'POST',
        json: {
          productId: p.id, startDate: dates.start, endDate: dates.end, guests: Number(values.guests) || 1,
          phone: values.phone.trim() || null, arrivalTime: values.arrivalTime || null, notes: values.notes.trim() || null,
        },
      })
      navigate(`/reservas/${reservation.id}`, { state: { reservation } })
    } catch (err) {
      if (err.status === 409) booked.retry() // someone else took the dates: show them crossed out
      setErrors({ ...err.fields, form: err.message })
      setSending(false)
    }
  }

  return (
    <article>
      <header className="detail-head">
        <div className="container">
          <div>
            <p className="map-label">Reserva</p>
            <h1>{p.name}</h1>
          </div>
          <Link to={`/producto/${p.id}`} className="back-link" aria-label="Volver al alojamiento">
            <ArrowLeft size={22} aria-hidden="true" />
          </Link>
        </div>
      </header>
      <div className="container detail-body booking-layout">
        <section className="booking-product" aria-labelledby="booking-product-title">
          <h2 id="booking-product-title" className="sr-only">Detalle del alojamiento</h2>
          <Gallery images={p.images} name={p.name} />
          <p className="booking-meta">
            {p.city && <span><MapPin size={16} aria-hidden="true" /> {[p.address, p.city].filter(Boolean).join(', ')}</span>}
            {p.category && <span className="map-label">{p.category.title}</span>}
          </p>
          <p className="description">{p.description}</p>
          {p.features.length > 0 && (
            <>
              <h3>Lo más destacado</h3>
              <ul className="feature-list">
                {p.features.map((f) => (
                  <li key={f.id}><span className="feature-chip"><FeatureIcon icon={f.icon} /></span>{f.name}</li>
                ))}
              </ul>
            </>
          )}
          {p.policies.length > 0 && (
            <details className="booking-policies">
              <summary>Políticas del alojamiento</summary>
              <ul className="policy-list">
                {p.policies.map((x, i) => <li key={i}><h3>{x.title}</h3><p>{x.description}</p></li>)}
              </ul>
            </details>
          )}
        </section>

        <form className="booking-form" onSubmit={onSubmit} noValidate aria-labelledby="booking-form-title">
          <h2 id="booking-form-title">Completa tu reserva</h2>

          <fieldset className="booking-section">
            <legend>Tus datos</legend>
            <div className="field-row field-row-2">
              <div className="field">
                <label htmlFor="b-first">Nombre</label>
                <input id="b-first" value={user.firstName} readOnly />
              </div>
              <div className="field">
                <label htmlFor="b-last">Apellido</label>
                <input id="b-last" value={user.lastName} readOnly />
              </div>
            </div>
            <div className="field">
              <label htmlFor="b-email">Correo electrónico</label>
              <input id="b-email" type="email" value={user.email} readOnly />
              <p className="hint">Aquí te enviaremos la confirmación de la reserva.</p>
            </div>
          </fieldset>

          <fieldset className="booking-section">
            <legend>Fechas</legend>
            <div className="field">
              <label htmlFor="booking-dates">Llegada y salida</label>
              <div className="date-text">
                <CalendarDays size={18} aria-hidden="true" />
                <input id="booking-dates" readOnly placeholder="Elige las fechas en el calendario"
                  value={dates.end ? `${formatRange(dates.start, dates.end)} · ${countLabel(nights, 'noche', 'noches')}` : dates.start ? `${formatShort(dates.start)} – elige la salida` : ''}
                  aria-invalid={Boolean(errors.dates)} aria-describedby={errors.dates ? 'dates-error' : undefined} />
              </div>
              {errors.dates && <p id="dates-error" className="error" role="alert">{errors.dates}</p>}
            </div>
            {booked.state.status === 'error' ? (
              <div className="state" role="alert">
                <p>No pudimos cargar las fechas ocupadas. Sin ellas no podemos confirmar tu reserva.</p>
                <button type="button" className="btn btn-solid" onClick={booked.retry}>Reintentar</button>
              </div>
            ) : booked.state.data ? (
              <DateRangeCalendar booked={booked.state.data} value={dates} onChange={pickDates} label="Elige las fechas de tu estadía" />
            ) : <div className="skeleton skeleton-tall" aria-label="Cargando calendario" />}
          </fieldset>

          <fieldset className="booking-section">
            <legend>Para el anfitrión <span className="hint">(opcional)</span></legend>
            <div className="field-row field-row-2">
              <div className="field">
                <label htmlFor="b-guests">Huéspedes</label>
                <input id="b-guests" type="number" min={1} max={20} value={values.guests} onChange={set('guests')}
                  aria-invalid={Boolean(errors.guests)} aria-describedby={errors.guests ? 'guests-error' : undefined} />
                {errors.guests && <p id="guests-error" className="error">{errors.guests}</p>}
              </div>
              <div className="field">
                <label htmlFor="b-arrival">Hora estimada de llegada</label>
                <input id="b-arrival" type="time" value={values.arrivalTime} onChange={set('arrivalTime')} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="b-phone">Teléfono de contacto</label>
              <input id="b-phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={20} placeholder="300 123 4567"
                value={values.phone} onChange={set('phone')}
                aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'phone-error' : undefined} />
              {errors.phone && <p id="phone-error" className="error">{errors.phone}</p>}
            </div>
            <div className="field">
              <label htmlFor="b-notes">Notas para el anfitrión</label>
              <textarea id="b-notes" rows={3} maxLength={500} placeholder="Ej.: viajamos con una mascota pequeña"
                value={values.notes} onChange={set('notes')} />
            </div>
          </fieldset>

          <div className="booking-summary" aria-live="polite">
            {nights > 0 ? (
              <>
                <span>{p.pricePerNight != null ? `${formatPrice(p.pricePerNight)} × ${countLabel(nights, 'noche', 'noches')}` : countLabel(nights, 'noche', 'noches')}</span>
                {total && <strong>Total {total}</strong>}
              </>
            ) : <span className="muted">Elige tus fechas para ver el total.</span>}
          </div>
          {errors.form && <p className="error form-error" role="alert">{errors.form}</p>}
          <button type="submit" className="btn btn-route btn-block" disabled={sending}>
            {sending ? 'Confirmando…' : 'Confirmar reserva'}
          </button>
        </form>
      </div>
    </article>
  )
}
