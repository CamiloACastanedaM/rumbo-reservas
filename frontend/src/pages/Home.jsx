import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SearchX, X } from 'lucide-react'
import { api, countLabel, imageSrc } from '../api.js'
import ProductCard from '../components/ProductCard.jsx'
import Pagination from '../components/Pagination.jsx'
import SearchBlock from '../components/SearchBlock.jsx'
import { formatShort, toIso } from '../components/DateRangeCalendar.jsx'
import useApi from '../components/useApi.js'

// One random seed per page load: a reload reshuffles, while paging and coming back from a detail keep the order.
const seed = crypto.getRandomValues(new Uint32Array(1))[0]

export default function Home() {
  const [categories, setCategories] = useState(null)
  const [params, setParams] = useSearchParams()
  useEffect(() => {
    api('/categories').then(setCategories).catch(() => setCategories([]))
  }, [])

  // Selected categories live in the URL (?categorias=1,3) so a reload or a shared link keeps the filter.
  const selected = (params.get('categorias') ?? '').split(',').filter(Boolean).map(Number).filter(Number.isInteger)
  const setSelected = (ids) => setParams((prev) => {
    const next = new URLSearchParams(prev)
    next.delete('pagina')
    if (ids.length) next.set('categorias', ids.join(','))
    else next.delete('categorias')
    return next
  })
  const toggle = (id) => setSelected(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])

  // The search also lives in the URL (?buscar=&llegada=&salida=), so back/forward and shared links work.
  // Dates of an old shared link that already passed are dropped, so the link still searches the text.
  const fresh = (params.get('llegada') ?? '') >= toIso(new Date())
  const search = { q: params.get('buscar') ?? '', start: fresh ? params.get('llegada') : null, end: fresh ? params.get('salida') : null }
  const active = Boolean(search.q || (search.start && search.end))
  const runSearch = ({ q, start, end }) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      for (const [key, val] of [['buscar', q], ['llegada', start], ['salida', end]]) {
        if (val) next.set(key, val)
        else next.delete(key)
      }
      return next
    })
    requestAnimationFrame(() => document.getElementById('results-title')?.scrollIntoView({ behavior: 'smooth' }))
  }
  const clearSearch = () => runSearch({ q: '', start: null, end: null })

  return (
    <>
      {/* key: back/forward or a cleared search refills the fields from the URL */}
      <SearchBlock key={`${search.q}|${search.start}|${search.end}`} initial={search} onSearch={runSearch} />
      {/* key: a new search starts again on page 1 */}
      {active && <SearchResults key={`${search.q}|${search.start}|${search.end}`} search={search} onClear={clearSearch} />}
      <Categories categories={categories} selected={selected} onToggle={(id) => {
        toggle(id)
        document.getElementById('rec-title')?.scrollIntoView({ behavior: 'smooth' })
      }} />
      <Recommendations categories={categories ?? []} selected={selected} onToggle={toggle}
        onClear={() => setSelected([])} />
    </>
  )
}

const resultWord = (n) => countLabel(n, 'alojamiento', 'alojamientos')

/** Results of the search block. Categories and recommendations stay below, as on the plain home. */
function SearchResults({ search, onClear }) {
  const [page, setPage] = useState(0)
  const query = new URLSearchParams({ q: search.q, page, size: 10 })
  if (search.start && search.end) { query.set('start', search.start); query.set('end', search.end) }
  const { state, retry } = useApi(`/products/search?${query}`)

  const criteria = [
    search.q && `«${search.q}»`,
    search.start && search.end && `del ${formatShort(search.start)} al ${formatShort(search.end)}`,
  ].filter(Boolean).join(', ')

  return (
    <section className="page-section results-section" aria-labelledby="results-title">
      <div className="container">
        <div className="section-head">
          <div>
            <h2 id="results-title" className="section-title">Resultados de tu búsqueda</h2>
            <p className="section-note" role="status">
              {state.data ? `${resultWord(state.data.totalElements)} para ${criteria}` : `Buscando ${criteria}…`}
              {state.data && search.start && ' · solo alojamientos libres en esas fechas'}
            </p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClear}>
            <X size={16} aria-hidden="true" /> Limpiar búsqueda
          </button>
        </div>
        {state.status === 'error' ? (
          <div className="state" role="alert">
            <p>{state.message}</p>
            <button type="button" className="btn btn-solid" onClick={retry}>Reintentar</button>
          </div>
        ) : !state.data ? (
          <div className="product-grid" aria-hidden="true">
            {Array.from({ length: 2 }, (_, i) => <div key={i} className="skeleton" />)}
          </div>
        ) : state.data.content.length === 0 ? (
          <div className="state">
            <SearchX size={32} aria-hidden="true" className="state-icon" />
            <p>No encontramos alojamientos para {criteria}.</p>
            <p className="muted">Prueba con otra ciudad, menos palabras u otras fechas.</p>
            <button type="button" className="btn btn-solid" onClick={onClear}>Limpiar búsqueda</button>
          </div>
        ) : (
          <>
            <ul className="product-grid" aria-busy={state.status === 'loading'}>
              {state.data.content.map((p, i) => (
                <li key={p.id} style={{ '--i': i }}><ProductCard product={p} /></li>
              ))}
            </ul>
            <Pagination label="Paginación de resultados" page={state.data.page} totalPages={state.data.totalPages} onChange={(p) => {
              setPage(p)
              document.getElementById('results-title')?.scrollIntoView({ behavior: 'smooth' })
            }} />
          </>
        )}
      </div>
    </section>
  )
}

function Categories({ categories, selected, onToggle }) {
  return (
    <section className="page-section" aria-labelledby="cat-title">
      <div className="container">
        <div className="section-head">
          <h2 id="cat-title" className="section-title">Categorías</h2>
        </div>
        {categories === null ? (
          <div className="skeleton" aria-hidden="true" />
        ) : categories.length === 0 ? (
          <p className="section-note">Aún no hay categorías para mostrar.</p>
        ) : (
          <ul className="category-list">
            {categories.map((c) => (
              <li key={c.id}>
                <button type="button" className="category" aria-pressed={selected.includes(c.id)}
                  onClick={() => onToggle(c.id)}>
                  {c.imageUrl && <img src={imageSrc(c.imageUrl)} alt="" loading="lazy" />}
                  <span className="category-body">
                    <span className="category-title">{c.title}</span>
                    {c.description && <span className="category-desc">{c.description}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

function Recommendations({ categories, selected, onToggle, onClear }) {
  const [params, setParams] = useSearchParams()
  const page = Math.max(0, Number(params.get('pagina') ?? 1) - 1) || 0
  const [state, setState] = useState({ status: 'loading' })
  const [retry, setRetry] = useState(0)
  const selectedKey = selected.join(',')

  useEffect(() => {
    let alive = true
    setState((s) => ({ ...s, status: 'loading' }))
    api(`/products?page=${page}&size=10&seed=${seed}&categoryIds=${selectedKey}`)
      .then((data) => {
        if (!alive) return
        // A stale ?pagina past the last page: go back to the first one instead of a false empty state.
        if (data.content.length === 0 && data.totalElements > 0) {
          setParams((prev) => { const next = new URLSearchParams(prev); next.delete('pagina'); return next }, { replace: true })
        }
        else setState({ status: 'ok', data })
      })
      .catch((err) => alive && setState({ status: 'error', message: err.message }))
    return () => { alive = false }
  }, [page, retry, selectedKey])

  const goTo = (p) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      if (p === 0) next.delete('pagina')
      else next.set('pagina', String(p + 1))
      return next
    })
    document.getElementById('rec-title')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="page-section" aria-labelledby="rec-title">
      <div className="container">
        <div className="section-head">
          <h2 id="rec-title" className="section-title">Recomendaciones</h2>
        </div>
        {categories.length > 0 && (
          <div className="filter-bar" role="group" aria-labelledby="filter-label">
            <span id="filter-label" className="map-label">Filtrar por categoría</span>
            <ul className="chips">
              {categories.map((c) => (
                <li key={c.id}>
                  <button type="button" className="chip" title={c.title} aria-pressed={selected.includes(c.id)} onClick={() => onToggle(c.id)}>
                    {c.title}
                  </button>
                </li>
              ))}
            </ul>
            {selected.length > 0 && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={onClear}>
                <X size={16} aria-hidden="true" /> Limpiar filtros
              </button>
            )}
          </div>
        )}
        {state.data && (
          <p className="result-count" role="status">
            {state.data.totalElements} de {state.data.catalogTotal} {state.data.catalogTotal === 1 ? 'producto' : 'productos'}
          </p>
        )}
        {state.status === 'error' ? (
          <div className="state" role="alert">
            <p>{state.message}</p>
            <button type="button" className="btn btn-solid" onClick={() => setRetry((r) => r + 1)}>Reintentar</button>
          </div>
        ) : !state.data ? (
          <div className="product-grid" aria-hidden="true">
            {Array.from({ length: 4 }, (_, i) => <div key={i} className="skeleton" />)}
          </div>
        ) : state.data.content.length === 0 ? (
          selected.length > 0 ? (
            <div className="state">
              <p>No hay alojamientos en esas categorías por ahora.</p>
              <button type="button" className="btn btn-solid" onClick={onClear}>Limpiar filtros</button>
            </div>
          ) : <div className="state"><p>Todavía no hay alojamientos publicados.</p></div>
        ) : (
          <>
            <ul className="product-grid" aria-busy={state.status === 'loading'}>
              {state.data.content.map((p, i) => (
                <li key={p.id} style={{ '--i': i }}><ProductCard product={p} /></li>
              ))}
            </ul>
            <Pagination page={state.data.page} totalPages={state.data.totalPages} onChange={goTo} />
          </>
        )}
      </div>
    </section>
  )
}
