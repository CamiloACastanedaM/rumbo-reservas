import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../auth.jsx'
import { FavoritesProvider } from '../favorites.jsx'
import { readSession, writeSession } from '../api.js'
import Header from '../components/Header.jsx'
import Register from '../pages/Register.jsx'
import Login from '../pages/Login.jsx'
import Home from '../pages/Home.jsx'
import ProductDetail from '../pages/ProductDetail.jsx'
import AdminLayout from '../pages/admin/AdminLayout.jsx'

const json = (body, status = 200) => new Response(JSON.stringify(body), { status })
const ana = { id: 2, firstName: 'Ana', lastName: 'Gómez', email: 'ana@correo.com', role: 'USER' }

/** fetch mock answering by URL fragment; unknown URLs fail like a server error. */
function mockApi(routes) {
  const fn = vi.fn(async (url) => {
    const hit = Object.entries(routes).find(([part]) => url.includes(part))
    return hit ? hit[1](url) : json({ message: 'sin mock' }, 500)
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
          <Route path="/iniciar-sesion" element={<Login />} />
          <Route path="/" element={<p>Inicio</p>} />
        </Routes>
      </FavoritesProvider>
    </AuthProvider>
  </MemoryRouter>,
)

afterEach(() => {
  writeSession(null)
  vi.unstubAllGlobals()
})

describe('Register user (#13) and welcome email (#19)', () => {
  it('shows inline errors for every rule before calling the API', async () => {
    const fetchMock = mockApi({})
    app('/registro', <Register />, '/registro')
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(screen.getByText('Escribe tu nombre.')).toBeInTheDocument()
    expect(screen.getByText('Crea una contraseña.')).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Nombre'), 'Ana3')
    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'ana@correo')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'solotexto')
    expect(screen.getByText('El nombre solo puede tener letras.')).toBeInTheDocument()
    expect(screen.getByText(/Escribe un correo válido/)).toBeInTheDocument()
    expect(screen.getByText('La contraseña debe tener al menos una letra y un número.')).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre')).toHaveAttribute('aria-invalid', 'true')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('registers, confirms the email was sent and can resend it', async () => {
    const fetchMock = mockApi({
      '/auth/register': () => json(ana, 201),
      '/auth/resend-confirmation': () => new Response(null, { status: 202 }),
    })
    app('/registro', <Register />, '/registro')
    await userEvent.type(screen.getByLabelText('Nombre'), 'Ana')
    await userEvent.type(screen.getByLabelText('Apellido'), 'Gómez')
    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'ana@correo.com')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'viajar2026')
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(await screen.findByText('¡Listo, Ana!')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('ana@correo.com')
    await userEvent.click(screen.getByRole('button', { name: 'Reenviar correo' }))
    expect(fetchMock).toHaveBeenLastCalledWith(expect.stringContaining('/auth/resend-confirmation'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ email: 'ana@correo.com' }) }))
  })
})

describe('Login (#14), logout (#15) and admin role (#16)', () => {
  it('shows a clear error for wrong credentials', async () => {
    mockApi({ '/auth/login': () => json({ message: 'El correo o la contraseña no son correctos.' }, 401) })
    app('/iniciar-sesion', <Login />, '/iniciar-sesion')
    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'ana@correo.com')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'mala1234')
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('no son correctos')
    expect(readSession()).toBeNull()
  })

  it('logs in, shows name + initials avatar, and logs out back to anonymous', async () => {
    mockApi({ '/auth/login': () => json({ token: 'jwt', user: ana }), '/users/me': () => json(ana) })
    app('/iniciar-sesion', <Login />, '/iniciar-sesion')
    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'ana@correo.com')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'viajar2026')
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

    const trigger = await screen.findByRole('button', { name: /Ana Gómez/ })
    expect(within(trigger).getByText('AG')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Administración/ })).not.toBeInTheDocument()
    expect(readSession().token).toBe('jwt')

    await userEvent.click(trigger)
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    expect(readSession()).toBeNull()
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })

  it('shows "Administración" only to admins and blocks the panel for everyone else', async () => {
    mockApi({ '/users/me': () => json(ana) })
    app('/administracion', <AdminLayout />, '/administracion')
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()

    writeSession({ token: 't', user: ana })
    expect(await screen.findByText('No tienes permisos de administrador')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Administración/ })).not.toBeInTheDocument()

    writeSession({ token: 't', user: { ...ana, role: 'ADMIN' } })
    expect(await screen.findByRole('link', { name: /Administración/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Usuarios y permisos/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Administrar características/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Agregar categoría/ })).toBeInTheDocument()
  })
})

describe('Features in detail (#18) and category filter (#20)', () => {
  it('lists each feature with its icon under "Características"', async () => {
    mockApi({
      '/products/5': () => json({
        id: 5, name: 'Cabaña', description: 'd', images: ['https://img/1.jpg'], category: null,
        features: [{ id: 1, name: 'Wifi', icon: 'wifi' }, { id: 2, name: 'Piscina', icon: 'waves' }],
        policies: [], rating: { average: 0, count: 0 },
      }),
    })
    app('/producto/5', <ProductDetail />, '/producto/:id')
    const block = (await screen.findByRole('heading', { name: 'Características' })).closest('section')
    const items = within(block).getAllByRole('listitem')
    expect(items.map((li) => li.textContent)).toEqual(['Wifi', 'Piscina'])
    expect(items[0].querySelector('svg')).not.toBeNull()
  })

  it('filters by one or more categories, shows "X de Y productos" and clears', async () => {
    const card = (id, category) => ({ id, name: `Alojamiento ${id}`, city: 'Salento', pricePerNight: 1000, mainImage: null, category })
    const fetchMock = mockApi({
      '/categories': () => json([{ id: 1, title: 'Cabañas' }, { id: 2, title: 'Fincas' }]),
      '/products?': (url) => {
        const ids = new URL(url).searchParams.get('categoryIds')
        const all = [card(1, 'Cabañas'), card(2, 'Fincas'), card(3, null)]
        const content = ids ? all.filter((p) => (ids.includes('1') && p.category === 'Cabañas') || (ids.includes('2') && p.category === 'Fincas')) : all
        return json({ content, page: 0, size: 10, totalElements: content.length, totalPages: 1, catalogTotal: 3 })
      },
    })
    app('/', <Home />, '/')
    expect(await screen.findByText('3 de 3 productos')).toBeInTheDocument()

    const filters = screen.getByRole('group', { name: 'Filtrar por categoría' })
    await userEvent.click(within(filters).getByRole('button', { name: 'Cabañas' }))
    expect(await screen.findByText('1 de 3 productos')).toBeInTheDocument()
    expect(within(filters).getByRole('button', { name: 'Cabañas' })).toHaveAttribute('aria-pressed', 'true')

    await userEvent.click(within(filters).getByRole('button', { name: 'Fincas' }))
    expect(await screen.findByText('2 de 3 productos')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenLastCalledWith(expect.stringContaining('categoryIds=1,2'), expect.anything())

    await userEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    await waitFor(() => expect(screen.getByText('3 de 3 productos')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: 'Limpiar filtros' })).not.toBeInTheDocument()
  })
})
