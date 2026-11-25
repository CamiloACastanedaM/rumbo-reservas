import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AuthProvider from '../AuthProvider.jsx'
import FavoritesProvider from '../FavoritesProvider.jsx'
import { writeSession } from '../api.js'
import Header from '../components/Header.jsx'
import DateRangeCalendar from '../components/DateRangeCalendar.jsx'
import { toIso } from '../dates.js'
import Home from '../pages/Home.jsx'
import ProductDetail from '../pages/ProductDetail.jsx'
import Favorites from '../pages/Favorites.jsx'
import CategoryList from '../pages/admin/CategoryList.jsx'

const json = (body, status = 200) => new Response(JSON.stringify(body), { status })
const ana = { id: 2, firstName: 'Ana', lastName: 'Gómez', email: 'ana@correo.com', role: 'USER' }
const card = (id, name) => ({ id, name, city: 'Salento', pricePerNight: 1000, mainImage: null, category: null, rating: { average: 4.5, count: 2 } })
const page = (content) => ({ content, page: 0, size: 10, totalElements: content.length, totalPages: 1, catalogTotal: 20 })
const detail = {
  id: 5, name: 'Cabaña Roble', description: 'Bosque y río', city: 'Salento', images: ['https://img/1.jpg'], category: null,
  features: [], rating: { average: 0, count: 0 },
  policies: [{ title: 'Normas de la casa', description: 'Sin fiestas.' }, { title: 'Política de cancelación', description: 'Gratis hasta 7 días antes.' }],
}

/** fetch mock answering by URL fragment (first match wins); unknown URLs fail like a server error. */
function mockApi(routes) {
  const fn = vi.fn(async (url, init = {}) => {
    const hit = Object.entries(routes).find(([part]) => url.includes(part))
    return hit ? hit[1](url, init) : json({ message: 'sin mock' }, 500)
  })
  vi.stubGlobal('fetch', fn)
  return fn
}

const app = (path, element, routePath = '*') => render(
  <MemoryRouter initialEntries={[path]}>
    <AuthProvider>
      <FavoritesProvider>
        <Header />
        <Routes>
          <Route path={routePath} element={element} />
          <Route path="/favoritos" element={<Favorites />} />
          <Route path="/iniciar-sesion" element={<p>Pantalla de login</p>} />
        </Routes>
      </FavoritesProvider>
    </AuthProvider>
  </MemoryRouter>,
)

afterEach(() => {
  writeSession(null)
  vi.unstubAllGlobals()
})

describe('Search (#22)', () => {
  it('suggests while typing and shows structured results above categories and recommendations', async () => {
    const fetchMock = mockApi({
      '/products/suggestions': () => json(['Salento, Quindío']),
      '/products/search': () => json(page([card(1, 'Cabaña Cocora')])),
      '/categories': () => json([]),
      '/products?': () => json(page([])),
    })
    app('/', <Home />, '/')
    expect(screen.getByRole('heading', { level: 1, name: 'Encuentra tu próximo rumbo' })).toBeInTheDocument()

    const input = screen.getByRole('combobox', { name: 'Destino o alojamiento' })
    await userEvent.type(input, 'sal')
    const option = await screen.findByRole('option', { name: 'Salento, Quindío' })
    await userEvent.keyboard('{ArrowDown}{Enter}')
    expect(option).toBeTruthy()
    expect(input).toHaveValue('Salento, Quindío')

    await userEvent.click(screen.getByRole('button', { name: 'Realizar búsqueda' }))
    const results = (await screen.findByRole('heading', { name: 'Resultados de tu búsqueda' })).closest('section')
    expect(await within(results).findByText('1 alojamiento para «Salento, Quindío»')).toBeInTheDocument()
    expect(within(results).getByRole('link', { name: /Cabaña Cocora/ })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/products/search?q=Salento'), expect.anything())
    expect(screen.getByRole('heading', { name: 'Categorías' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Recomendaciones' })).toBeInTheDocument()
  })

  it('sends the dates picked on the double calendar', async () => {
    const fetchMock = mockApi({
      '/products/search': () => json(page([])),
      '/categories': () => json([]),
      '/products?': () => json(page([])),
    })
    app('/', <Home />, '/')
    await userEvent.click(screen.getByRole('button', { name: 'Fechas' }))
    const calendar = screen.getByRole('group', { name: 'Elige las fechas de tu estadía' })
    expect(within(calendar).getAllByRole('table')).toHaveLength(2)
    const free = within(calendar).getAllByRole('button', { name: /disponible$/ })
    await userEvent.click(free[1])
    await userEvent.click(free[4])
    await userEvent.click(screen.getByRole('button', { name: 'Realizar búsqueda' }))
    expect(await screen.findByText(/No encontramos alojamientos/)).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/start=\d{4}-\d{2}-\d{2}&end=\d{4}-\d{2}-\d{2}/), expect.anything())
  })
})

describe('Availability (#23)', () => {
  it('crosses out booked days', () => {
    const d = new Date()
    const start = toIso(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1))
    const end = toIso(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 3))
    render(<DateRangeCalendar booked={[{ start, end }]} label="Calendario" />)
    expect(screen.getAllByRole('img', { name: /ocupado$/ })).toHaveLength(2)
  })

  it('shows a clear error and retries', async () => {
    let fail = true
    mockApi({
      '/availability': () => (fail ? json({ message: 'x' }, 500) : json([])),
      '/products/5/reviews': () => json({ rating: { average: 0, count: 0 }, reviews: [], canReview: false }),
      '/products/5': () => json(detail),
    })
    app('/producto/5', <ProductDetail />, '/producto/:id')
    expect(await screen.findByText('No pudimos obtener las fechas disponibles en este momento.')).toBeInTheDocument()
    fail = false
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByRole('group', { name: 'Calendario de disponibilidad' })).toBeInTheDocument()
  })
})

describe('Favorites (#24, #25)', () => {
  it('asks anonymous visitors to log in instead of calling the API', async () => {
    const fetchMock = mockApi({ '/categories': () => json([]), '/products?': () => json(page([card(1, 'Cabaña Cocora')])) })
    app('/', <Home />, '/')
    await userEvent.click(await screen.findByRole('button', { name: 'Agregar «Cabaña Cocora» a favoritos' }))
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining('/favorites'), expect.anything())
  })

  it('toggles with one click and the «Mis favoritos» page follows the shared list', async () => {
    writeSession({ token: 'jwt', user: ana })
    const fetchMock = mockApi({
      '/users/me': () => json(ana),
      '/favorites/': () => new Response(null, { status: 204 }),
      '/favorites': () => json([]),
      '/categories': () => json([]),
      '/products?': () => json(page([card(1, 'Cabaña Cocora')])),
    })
    app('/', <Home />, '/')
    const heart = await screen.findByRole('button', { name: 'Agregar «Cabaña Cocora» a favoritos' })
    await userEvent.click(heart)
    expect(heart).toHaveAttribute('aria-pressed', 'true')
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/favorites/1'), expect.objectContaining({ method: 'POST' }))

    await userEvent.click(screen.getByRole('button', { name: /Ana Gómez/ }))
    await userEvent.click(screen.getByRole('link', { name: 'Mis favoritos' }))
    expect(await screen.findByRole('heading', { name: 'Mis favoritos' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Quitar «Cabaña Cocora» de favoritos' }))
    expect(await screen.findByText('Todavía no tienes favoritos.')).toBeInTheDocument()
  })
})

describe('Detail: policies (#26), share (#27) and reviews (#28)', () => {
  it('shows the underlined policies title and each policy in columns', async () => {
    mockApi({
      '/availability': () => json([]),
      '/reviews': () => json({ rating: { average: 0, count: 0 }, reviews: [], canReview: false }),
      '/products/5': () => json(detail),
    })
    app('/producto/5', <ProductDetail />, '/producto/:id')
    const block = (await screen.findByRole('heading', { name: 'Políticas del alojamiento' })).closest('section')
    expect(block).toHaveClass('policies-block')
    expect(within(block).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['Normas de la casa', 'Política de cancelación', 'Privacidad en WhatsApp'])
  })

  it('opens the share window with image, description, link, message and networks', async () => {
    mockApi({
      '/availability': () => json([]),
      '/reviews': () => json({ rating: { average: 0, count: 0 }, reviews: [], canReview: false }),
      '/products/5': () => json(detail),
    })
    const open = vi.fn()
    vi.stubGlobal('open', open)
    app('/producto/5', <ProductDetail />, '/producto/:id')
    await userEvent.click(await screen.findByRole('button', { name: 'Compartir' }))
    const dialog = screen.getByRole('dialog', { name: 'Compartir alojamiento', hidden: true })
    expect(within(dialog).getByRole('img', { name: 'Foto de Cabaña Roble', hidden: true })).toBeInTheDocument()
    expect(within(dialog).getByRole('textbox', { name: 'Enlace directo', hidden: true })).toHaveValue(`${window.location.origin}/producto/5`)
    const message = within(dialog).getByRole('textbox', { name: 'Tu mensaje', hidden: true })
    await userEvent.clear(message)
    await userEvent.type(message, 'Vamos en enero')
    await userEvent.click(within(dialog).getByRole('radio', { name: 'X (Twitter)', hidden: true }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Compartir en X (Twitter)', hidden: true }))
    expect(open).toHaveBeenCalledWith(expect.stringContaining('https://x.com/intent/tweet?text=Vamos%20en%20enero'), '_blank', 'noopener,noreferrer')
  })

  it('lets a guest with a finished stay rate it and updates the average at once', async () => {
    writeSession({ token: 'jwt', user: ana })
    const posted = { rating: { average: 4, count: 1 }, reviews: [{ id: 1, rating: 4, comment: 'Muy lindo', userName: 'Ana G.', createdAt: '2026-11-20T15:00:00Z' }], canReview: false }
    const fetchMock = mockApi({
      '/users/me': () => json(ana),
      '/favorites': () => json([]),
      '/availability': () => json([]),
      '/reviews': (url, init) => json(init.method === 'POST' ? posted : { rating: { average: 0, count: 0 }, reviews: [], canReview: true }, init.method === 'POST' ? 201 : 200),
      '/products/5': () => json(detail),
    })
    app('/producto/5', <ProductDetail />, '/producto/:id')
    await userEvent.click(await screen.findByRole('radio', { name: '4 estrellas' }))
    await userEvent.type(screen.getByRole('textbox', { name: /Cuéntanos tu experiencia/ }), 'Muy lindo')
    await userEvent.click(screen.getByRole('button', { name: 'Publicar reseña' }))
    expect(await screen.findByText('Promedio de 1 reseña')).toBeInTheDocument()
    expect(screen.getByText('Ana G.')).toBeInTheDocument()
    expect(screen.getAllByRole('img', { name: '4 de 5 estrellas' })).toHaveLength(2)
    await waitFor(() => expect(screen.getByLabelText('Puntuación media 4,0 de 5')).toBeInTheDocument())
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/products/5/reviews'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ rating: 4, comment: 'Muy lindo' }) }))
  })
})

describe('Delete category (#29)', () => {
  it('names the category and its consequences before deleting', async () => {
    writeSession({ token: 'jwt', user: { ...ana, role: 'ADMIN' } })
    const fetchMock = mockApi({
      '/admin/categories/1': () => new Response(null, { status: 204 }),
      '/admin/categories': () => json([{ id: 1, title: 'Glamping', productCount: 2 }, { id: 2, title: 'Fincas', productCount: 0 }]),
    })
    render(<MemoryRouter><AuthProvider><CategoryList /></AuthProvider></MemoryRouter>)
    await userEvent.click(await screen.findByRole('button', { name: 'Eliminar categoría Glamping' }))
    const dialog = screen.getByRole('dialog', { hidden: true })
    expect(within(dialog).getByText('¿Eliminar la categoría «Glamping»?')).toBeInTheDocument()
    expect(within(dialog).getByText(/2 productos quedarán sin categoría/)).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancelar', hidden: true }))
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining('/admin/categories/1'), expect.anything())

    await userEvent.click(screen.getByRole('button', { name: 'Eliminar categoría Glamping' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirmar', hidden: true }))
    await waitFor(() => expect(screen.queryByText('Glamping')).not.toBeInTheDocument())
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/admin/categories/1'), expect.objectContaining({ method: 'DELETE' }))
  })
})
