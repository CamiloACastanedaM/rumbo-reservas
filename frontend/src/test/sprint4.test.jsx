import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { AuthProvider } from '../auth.jsx'
import { FavoritesProvider } from '../favorites.jsx'
import { writeSession } from '../api.js'
import { toIso } from '../components/DateRangeCalendar.jsx'
import ProductDetail from '../pages/ProductDetail.jsx'
import Booking from '../pages/Booking.jsx'
import MyReservations, { BookingDone } from '../pages/Reservations.jsx'
import WhatsAppButton from '../components/WhatsAppButton.jsx'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const json = (body, status = 200) => new Response(JSON.stringify(body), { status })
const ana = { id: 2, firstName: 'Ana', lastName: 'Gómez', email: 'ana@correo.com', role: 'USER' }
const detail = {
  id: 5, name: 'Cabaña Roble', description: 'Bosque y río', city: 'Salento', address: 'Vereda Cocora', pricePerNight: 200000,
  images: ['https://img/1.jpg'], category: null, features: [], rating: { average: 0, count: 0 }, whatsappPhone: '573001234567',
  policies: [{ title: 'Normas de la casa', description: 'Sin fiestas.' }],
}
const card = { id: 5, name: 'Cabaña Roble', city: 'Salento', pricePerNight: 200000, mainImage: null, category: null, rating: { average: 0, count: 0 } }
const reservation = (id, status, extra = {}) => ({
  id, product: card, startDate: '2026-12-01', endDate: '2026-12-03', nights: 2, guests: 2, total: 400000,
  createdAt: '2026-11-25T15:00:00Z', status, canReview: false, phone: null, arrivalTime: null, notes: null, ...extra,
})

const day = (plus) => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate() + plus) }
const dayLabel = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const dayButton = (plus) => screen.getByRole('button', { name: new RegExp(`^${dayLabel.format(day(plus))},`) })

function mockApi(routes) {
  const fn = vi.fn(async (url, init = {}) => {
    const hit = Object.entries(routes).find(([part]) => url.includes(part))
    return hit ? hit[1](url, init) : json({ message: 'sin mock' }, 500)
  })
  vi.stubGlobal('fetch', fn)
  return fn
}

function LoginProbe() {
  const { state } = useLocation()
  return <p>Login: {state?.message} · vuelve a {state?.from}</p>
}

const app = (path) => render(
  <MemoryRouter initialEntries={[path]}>
    <AuthProvider>
      <FavoritesProvider>
        <Routes>
          <Route path="/producto/:id" element={<ProductDetail />} />
          <Route path="/producto/:id/reservar" element={<Booking />} />
          <Route path="/reservas/:id" element={<BookingDone />} />
          <Route path="/mis-reservas" element={<MyReservations />} />
          <Route path="/iniciar-sesion" element={<LoginProbe />} />
        </Routes>
      </FavoritesProvider>
    </AuthProvider>
  </MemoryRouter>,
)

afterEach(() => {
  writeSession(null)
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('Select dates (#30)', () => {
  it('«Reservar» without a session goes to login with the required notice and the way back', async () => {
    mockApi({
      '/availability': () => json([]),
      '/reviews': () => json({ rating: { average: 0, count: 0 }, reviews: [], canReview: false }),
      '/products/5': () => json(detail),
    })
    app('/producto/5')
    await userEvent.click(await screen.findByRole('button', { name: 'Reservar' }))
    expect(screen.getByText(/Debes iniciar sesión para reservar\. Si no tienes cuenta, regístrate/)).toHaveTextContent('vuelve a /producto/5/reservar')
  })

  it('prints the picked range in the dates field and rejects a range with booked days', async () => {
    writeSession({ token: 'jwt', user: ana })
    mockApi({
      '/availability': () => json([{ start: toIso(day(4)), end: toIso(day(6)) }]),
      '/favorites': () => json([]),
      '/products/5': () => json(detail),
    })
    app('/producto/5/reservar')
    await userEvent.click(await screen.findByRole('button', { name: new RegExp(`^${dayLabel.format(day(2))},`) }))
    await userEvent.click(dayButton(8))
    expect(screen.getByRole('alert')).toHaveTextContent('Ese rango incluye días ocupados')
    expect(screen.getByLabelText('Llegada y salida').value).toContain('elige la salida')

    await userEvent.click(dayButton(4)) // the day the next stay starts is still a valid departure
    expect(screen.getByLabelText('Llegada y salida').value).toContain('2 noches')
    expect(screen.queryByText(/Ese rango incluye/)).not.toBeInTheDocument()
  })
})

describe('Booking page and reservation (#31, #32)', () => {
  it('shows the lodging and the user, sends the optional data and lands on the confirmation', async () => {
    writeSession({ token: 'jwt', user: ana })
    const fetchMock = mockApi({
      '/availability': () => json([]),
      '/favorites': () => json([]),
      '/products/5': () => json(detail),
      '/reservations': () => json(reservation(9, 'PROXIMA', { notes: 'Llevamos perro' }), 201),
    })
    app('/producto/5/reservar')
    expect(await screen.findByRole('heading', { name: 'Cabaña Roble', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Bosque y río')).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre')).toHaveValue('Ana')
    expect(screen.getByLabelText('Apellido')).toHaveValue('Gómez')
    expect(screen.getByLabelText('Correo electrónico')).toHaveValue('ana@correo.com')

    await userEvent.click(screen.getByRole('button', { name: 'Confirmar reserva' }))
    expect(screen.getByText('Elige en el calendario el día de llegada y el de salida.')).toBeInTheDocument()

    await userEvent.click(dayButton(2))
    await userEvent.click(dayButton(4))
    await userEvent.type(screen.getByLabelText('Notas para el anfitrión'), 'Llevamos perro')
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar reserva' }))

    expect(await screen.findByRole('heading', { name: '¡Reserva confirmada!' })).toBeInTheDocument()
    expect(screen.getByText('Llevamos perro')).toBeInTheDocument()
    const [, init] = fetchMock.mock.calls.find(([url, i]) => url.endsWith('/reservations') && i.method === 'POST')
    expect(JSON.parse(init.body)).toMatchObject({ productId: 5, startDate: toIso(day(2)), endDate: toIso(day(4)), notes: 'Llevamos perro' })
  })

  it('explains a conflict and how to fix it', async () => {
    writeSession({ token: 'jwt', user: ana })
    mockApi({
      '/availability': () => json([]),
      '/favorites': () => json([]),
      '/products/5': () => json(detail),
      '/reservations': () => json({ message: 'Alguien reservó parte de esas fechas. Elige otro rango.', fields: {} }, 409),
    })
    app('/producto/5/reservar')
    await userEvent.click(await screen.findByRole('button', { name: new RegExp(`^${dayLabel.format(day(2))},`) }))
    await userEvent.click(dayButton(4))
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar reserva' }))
    expect(await screen.findByText('Alguien reservó parte de esas fechas. Elige otro rango.')).toBeInTheDocument()
  })
})

describe('History (#33)', () => {
  it('lists the stays with product, booking date, stay dates, status and «Calificar»', async () => {
    writeSession({ token: 'jwt', user: ana })
    mockApi({
      '/favorites': () => json([]),
      '/reservations/me': () => json([reservation(2, 'PROXIMA'), reservation(1, 'FINALIZADA', { canReview: true })]),
    })
    app('/mis-reservas')
    const items = await screen.findAllByRole('article')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('Próxima')
    expect(items[0]).toHaveTextContent('Reservada el')
    expect(items[1]).toHaveTextContent('Finalizada')
    expect(screen.getByRole('link', { name: 'Calificar' })).toHaveAttribute('href', '/producto/5#resenas')
  })

  it('asks to sign in first', () => {
    app('/mis-reservas')
    expect(screen.getByText(/Inicia sesión para ver tus reservas/)).toBeInTheDocument()
  })
})

describe('WhatsApp (#34)', () => {
  it('opens a chat with a message about the lodging and confirms it', async () => {
    const chat = {}
    const open = vi.fn(() => chat)
    vi.stubGlobal('open', open)
    render(<WhatsAppButton phone="573001234567" productName="Cabaña Roble" />)
    await userEvent.click(screen.getByRole('button', { name: 'Escribir al anfitrión por WhatsApp' }))
    expect(open).toHaveBeenCalledWith(expect.stringMatching(/^https:\/\/wa\.me\/573001234567\?text=.*Caba%C3%B1a%20Roble/), '_blank')
    expect(chat.opener).toBeNull()
    expect(toast.success).toHaveBeenCalled()
  })

  it('handles an invalid number and a blocked window', async () => {
    const open = vi.fn(() => null)
    vi.stubGlobal('open', open)
    const { rerender } = render(<WhatsAppButton phone="123" productName="Cabaña Roble" />)
    await userEvent.click(screen.getByRole('button', { name: 'Escribir al anfitrión por WhatsApp' }))
    expect(toast.error).toHaveBeenLastCalledWith(expect.stringContaining('no tiene un WhatsApp válido'))
    expect(open).not.toHaveBeenCalled()

    rerender(<WhatsAppButton phone="573001234567" productName="Cabaña Roble" />)
    await userEvent.click(screen.getByRole('button', { name: 'Escribir al anfitrión por WhatsApp' }))
    await waitFor(() => expect(toast.error).toHaveBeenLastCalledWith(expect.stringContaining('bloqueó la ventana')))
  })
})
