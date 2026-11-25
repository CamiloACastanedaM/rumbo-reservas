import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { api, imageSrc } from '../api.js'
import ProductCard from '../components/ProductCard.jsx'
import Pagination from '../components/Pagination.jsx'

// One random seed per page load: a reload reshuffles, while paging and coming back from a detail keep the order.
const seed = crypto.getRandomValues(new Uint32Array(1))[0]

export default function Home() {
  return (
    <>
      <SearchBlock />
      <Categories />
      <Recommendations />
    </>
  )
}

function SearchBlock() {
  const onSubmit = (e) => {
    e.preventDefault()
    toast('Muy pronto podrás buscar por destino y fechas. Mientras tanto, mira nuestras recomendaciones.')
  }
  return (
    <section className="search-block" aria-labelledby="search-title">
      <div className="container">
        <h1 id="search-title">Encuentra tu próximo rumbo</h1>
        <p className="lede">Cabañas, glamping, fincas y hoteles con encanto en toda Colombia. Elige el destino y las fechas, nosotros te mostramos qué está libre.</p>
        <form className="search-form" role="search" onSubmit={onSubmit}>
          <div className="search-field">
            <label htmlFor="q">Destino o alojamiento</label>
            <input id="q" name="q" type="text" placeholder="Salento, Cartagena, glamping…" autoComplete="off" />
          </div>
          <div className="search-field">
            <label htmlFor="dates">Fechas</label>
            <input id="dates" name="dates" type="text" placeholder="Llegada – salida" readOnly />
          </div>
          <button type="submit" className="btn btn-route">Realizar búsqueda</button>
        </form>
      </div>
    </section>
  )
}

function Categories() {
  const [categories, setCategories] = useState(null)
  useEffect(() => {
    api('/categories').then(setCategories).catch(() => setCategories([]))
  }, [])

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
              <li key={c.id} className="category">
                {c.imageUrl && <img src={imageSrc(c.imageUrl)} alt="" loading="lazy" />}
                <div className="category-body">
                  <h3>{c.title}</h3>
                  {c.description && <p>{c.description}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

function Recommendations() {
  const [params, setParams] = useSearchParams()
  const page = Math.max(0, Number(params.get('pagina') ?? 1) - 1) || 0
  const [state, setState] = useState({ status: 'loading' })
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let alive = true
    setState((s) => ({ ...s, status: 'loading' }))
    api(`/products?page=${page}&size=10&seed=${seed}`)
      .then((data) => alive && setState({ status: 'ok', data }))
      .catch((err) => alive && setState({ status: 'error', message: err.message }))
    return () => { alive = false }
  }, [page, retry])

  const goTo = (p) => {
    setParams(p === 0 ? {} : { pagina: String(p + 1) })
    document.getElementById('rec-title')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="page-section" aria-labelledby="rec-title">
      <div className="container">
        <div className="section-head">
          <h2 id="rec-title" className="section-title">Recomendaciones</h2>
          {state.data && <p className="section-note">{state.data.totalElements} alojamientos</p>}
        </div>
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
          <div className="state"><p>Todavía no hay alojamientos publicados.</p></div>
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
