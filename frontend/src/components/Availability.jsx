import { CalendarX } from 'lucide-react'
import DateRangeCalendar from './DateRangeCalendar.jsx'
import useApi from './useApi.js'

/** Booked stays of the product on a double calendar, with a retry when the dates can't be loaded. */
export default function Availability({ productId }) {
  const { state, retry } = useApi(`/products/${productId}/availability`)

  return (
    <section className="availability-block" aria-labelledby="availability-title">
      <h2 id="availability-title">Disponibilidad</h2>
      <p className="muted">Los días tachados ya están reservados. El resto están libres para tu próxima escapada.</p>
      {state.status === 'loading' && !state.data && <div className="skeleton skeleton-tall" aria-label="Cargando disponibilidad" />}
      {state.status === 'error' && (
        <div className="state" role="alert">
          <CalendarX size={32} aria-hidden="true" className="state-icon" />
          <p>No pudimos obtener las fechas disponibles en este momento.</p>
          <p className="muted">Revisa tu conexión e inténtalo de nuevo en unos segundos.</p>
          <button type="button" className="btn btn-solid" onClick={retry}>Reintentar</button>
        </div>
      )}
      {state.data && <DateRangeCalendar booked={state.data} label="Calendario de disponibilidad" />}
    </section>
  )
}
