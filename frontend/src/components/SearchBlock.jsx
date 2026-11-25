import { useEffect, useId, useRef, useState } from 'react'
import { CalendarDays, MapPin, Search } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../api.js'
import DateRangeCalendar, { formatRange, formatShort } from './DateRangeCalendar.jsx'

/**
 * Title, descriptor, text field with suggestions, double calendar and «Realizar búsqueda».
 * onSearch receives { q, start, end } (dates as YYYY-MM-DD or null).
 */
export default function SearchBlock({ initial, onSearch }) {
  const [q, setQ] = useState(initial.q)
  const [dates, setDates] = useState({ start: initial.start, end: initial.end })
  const [calendarOpen, setCalendarOpen] = useState(false)
  const datesRef = useRef(null)

  useEffect(() => {
    setQ(initial.q)
    setDates({ start: initial.start, end: initial.end })
  }, [initial.q, initial.start, initial.end])

  useEffect(() => {
    if (!calendarOpen) return
    const close = (e) => { if (!datesRef.current?.contains(e.target)) setCalendarOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setCalendarOpen(false) }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [calendarOpen])

  const pickDates = (range) => {
    setDates(range)
    if (range.end) setCalendarOpen(false)
  }

  const onSubmit = (e) => {
    e.preventDefault()
    if (dates.start && !dates.end) {
      toast.error('Elige también la fecha de salida.')
      setCalendarOpen(true)
      return
    }
    if (!q.trim() && !dates.start) {
      toast.error('Escribe un destino o elige tus fechas para buscar.')
      return
    }
    setCalendarOpen(false)
    onSearch({ q: q.trim(), start: dates.start, end: dates.end })
  }

  const datesText = dates.start ? (dates.end ? formatRange(dates.start, dates.end) : `${formatShort(dates.start)} – elige la salida`) : ''

  return (
    <section className="search-block" aria-labelledby="search-title">
      <div className="container">
        <h1 id="search-title">Encuentra tu próximo rumbo</h1>
        <p className="lede">Cabañas, glamping, fincas y hoteles con encanto en toda Colombia. Escribe un destino o el nombre de un alojamiento, elige tus fechas y te mostramos solo lo que está libre.</p>
        <form className="search-form" role="search" onSubmit={onSubmit} aria-label="Buscar alojamientos">
          <Suggest value={q} onChange={setQ} />
          <div className="search-field search-dates" ref={datesRef}>
            <label htmlFor="dates">Fechas</label>
            <button id="dates" type="button" className="dates-trigger" aria-expanded={calendarOpen} aria-controls="dates-panel"
              onClick={() => setCalendarOpen((o) => !o)}>
              <CalendarDays size={18} aria-hidden="true" />
              <span className={datesText ? '' : 'placeholder'}>{datesText || 'Llegada – salida'}</span>
            </button>
            <div id="dates-panel" className="dates-panel" hidden={!calendarOpen}>
              <p className="dates-help">{!dates.start || dates.end ? 'Elige el día de llegada.' : 'Ahora elige el día de salida.'}</p>
              <DateRangeCalendar value={dates} onChange={pickDates} label="Elige las fechas de tu estadía" />
              <div className="dates-actions">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDates({ start: null, end: null })}
                  disabled={!dates.start}>Borrar fechas</button>
                <button type="button" className="btn btn-solid btn-sm" onClick={() => setCalendarOpen(false)}>Listo</button>
              </div>
            </div>
          </div>
          <button type="submit" className="btn btn-route"><Search size={18} aria-hidden="true" /> Realizar búsqueda</button>
        </form>
      </div>
    </section>
  )
}

/** Accessible combobox: suggestions from the API while typing, arrows + Enter to pick one. */
function Suggest({ value, onChange }) {
  const [options, setOptions] = useState([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const listId = useId()

  useEffect(() => {
    const typed = value.trim()
    if (typed.length < 2) { setOptions([]); return }
    let alive = true
    const timer = setTimeout(() => {
      api(`/products/suggestions?q=${encodeURIComponent(typed)}`)
        .then((list) => { if (alive) { setOptions(list); setActive(-1) } })
        .catch(() => alive && setOptions([]))
    }, 180)
    return () => { alive = false; clearTimeout(timer) }
  }, [value])

  const shown = open && options.length > 0
  const choose = (option) => { onChange(option); setOpen(false) }

  const onKeyDown = (e) => {
    if (!shown) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % options.length) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a <= 0 ? options.length - 1 : a - 1)) }
    else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); choose(options[active]) }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false) }
  }

  return (
    <div className="search-field search-text">
      <label htmlFor="q">Destino o alojamiento</label>
      <input id="q" name="q" type="text" placeholder="Salento, Cartagena, glamping…" autoComplete="off"
        role="combobox" aria-autocomplete="list" aria-expanded={shown} aria-controls={listId}
        aria-activedescendant={shown && active >= 0 ? `${listId}-${active}` : undefined}
        value={value} maxLength={80}
        onChange={(e) => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} onKeyDown={onKeyDown} />
      <ul id={listId} role="listbox" className="suggestions" hidden={!shown} aria-label="Sugerencias">
        {options.map((option, i) => (
          <li key={option} id={`${listId}-${i}`} role="option" aria-selected={i === active}
            onMouseDown={(e) => { e.preventDefault(); choose(option) }}>
            <MapPin size={16} aria-hidden="true" /> <span>{option}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
