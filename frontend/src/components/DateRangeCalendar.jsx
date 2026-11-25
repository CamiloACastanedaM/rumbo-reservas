import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const WEEKDAYS = ['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do']
const monthTitle = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' })
const dayLabel = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const shortDate = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' })

/** Local YYYY-MM-DD (toISOString would shift the day in Colombia's UTC-5). */
export const toIso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const fromIso = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
export const formatShort = (iso) => shortDate.format(fromIso(iso)).replace('.', '')
const capitalize = (s) => s[0].toUpperCase() + s.slice(1)
export const formatRange = (start, end) => `${formatShort(start)} – ${formatShort(end)}`

/**
 * Two months side by side (stacked on phones), up to a year ahead.
 * booked: [{ start, end }] stays, where end is the free check-out day. Past and booked days are crossed out.
 * With onChange the visitor picks a range: first click = arrival, second click = departure.
 */
export default function DateRangeCalendar({ booked = [], value = {}, onChange, label }) {
  const [offset, setOffset] = useState(0)
  const today = toIso(new Date())
  const isBooked = (iso) => booked.some((r) => r.start <= iso && iso < r.end)
  // With an arrival picked, the first booked day after it can still be the departure: that guest leaves before the next one arrives.
  const canLeaveOn = (iso) => Boolean(value.start && !value.end && iso > value.start
    && !booked.some((r) => r.start < iso && r.end > value.start))

  const pick = (iso) => {
    if (!value.start || value.end || iso <= value.start) onChange({ start: iso, end: null })
    else onChange({ start: value.start, end: iso })
  }

  const now = new Date()
  const months = [0, 1].map((i) => new Date(now.getFullYear(), now.getMonth() + offset + i, 1))

  return (
    <div className="calendar" role="group" aria-label={label}>
      <div className="calendar-nav">
        <button type="button" className="icon-btn icon-btn-light" onClick={() => setOffset((o) => o - 1)} disabled={offset === 0}
          aria-label="Meses anteriores"><ChevronLeft size={20} aria-hidden="true" /></button>
        <button type="button" className="icon-btn icon-btn-light" onClick={() => setOffset((o) => o + 1)} disabled={offset >= 10}
          aria-label="Meses siguientes"><ChevronRight size={20} aria-hidden="true" /></button>
      </div>
      <div className="calendar-months">
        {months.map((first) => (
          <Month key={toIso(first)} first={first} today={today} isBooked={isBooked} canLeaveOn={canLeaveOn} value={value}
            onPick={onChange ? pick : null} />
        ))}
      </div>
      <ul className="calendar-legend" aria-label="Convenciones">
        <li><span className="swatch swatch-free" aria-hidden="true" /> Disponible</li>
        <li><span className="swatch swatch-booked" aria-hidden="true" /> {onChange ? 'No disponible' : 'Ocupado'}</li>
        {onChange && <li><span className="swatch swatch-picked" aria-hidden="true" /> Tus fechas</li>}
      </ul>
    </div>
  )
}

function Month({ first, today, isBooked, canLeaveOn, value, onPick }) {
  const lead = (first.getDay() + 6) % 7 // Monday first
  const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
  const cells = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => new Date(first.getFullYear(), first.getMonth(), i + 1))]
  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  return (
    <table className="month">
      <caption>{capitalize(monthTitle.format(first))}</caption>
      <thead><tr>{WEEKDAYS.map((w) => <th key={w} scope="col" abbr={w}>{w}</th>)}</tr></thead>
      <tbody>
        {weeks.map((week, i) => (
          <tr key={i}>
            {Array.from({ length: 7 }, (_, j) => {
              const d = week[j]
              if (!d) return <td key={j} />
              const iso = toIso(d)
              const past = iso < today
              const taken = !past && isBooked(iso)
              const edge = iso === value.start || iso === value.end
              const inside = value.start && value.end && iso > value.start && iso < value.end
              const exit = taken && onPick && canLeaveOn(iso)
              const status = past ? 'fecha pasada' : exit ? 'ocupado, disponible como salida' : taken ? 'ocupado' : 'disponible'
              const className = ['day', past && 'is-past', taken && 'is-booked', edge && 'is-edge', inside && 'is-inside', iso === today && 'is-today']
                .filter(Boolean).join(' ')
              const text = `${dayLabel.format(d)}, ${status}`
              return (
                <td key={j}>
                  {onPick ? (
                    <button type="button" className={className} disabled={past || (taken && !exit)} aria-pressed={edge || inside}
                      aria-label={text} onClick={() => onPick(iso)}>{d.getDate()}</button>
                  ) : (
                    <span className={className} aria-label={text} role="img">{d.getDate()}</span>
                  )}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
