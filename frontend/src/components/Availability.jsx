import { useEffect, useState } from 'react'
import { CalendarX } from 'lucide-react'
import { api } from '../api.js'
import DateRangeCalendar from './DateRangeCalendar.jsx'

/** Booked stays of the product on a double calendar, with a retry when the dates can't be loaded. */
export default function Availability({ productId }) {
  const [state, setState] = useState({ status: 'loading' })
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let alive = true
    setState({ status: 'loading' })
    api(`/products/${productId}/availability`)
      .then((booked) => alive && setState({ status: 'ok', booked }))
      .catch(() => alive && setState({ status: 'error' }))
    return () => { alive = false }
  }, [productId, retry])

  return (
    <section className="availability-block" aria-labelledby="availability-title">
      <h2 id="availability-title">Disponibilidad</h2>
      <p className="muted">Los días tachados ya están reservados. El resto están libres para tu próxima escapada.</p>
      {state.status === 'loading' && <div className="skeleton skeleton-tall" aria-label="Cargando disponibilidad" />}
      {state.status === 'error' && (
        <div className="state" role="alert">
          <CalendarX size={32} aria-hidden="true" className="state-icon" />
          <p>No pudimos obtener las fechas disponibles en este momento.</p>
          <p className="muted">Revisa tu conexión e inténtalo de nuevo en unos segundos.</p>
          <button type="button" className="btn btn-solid" onClick={() => setRetry((r) => r + 1)}>Reintentar</button>
        </div>
      )}
      {state.status === 'ok' && <DateRangeCalendar booked={state.booked} label="Calendario de disponibilidad" />}
    </section>
  )
}
