import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import Pagination from '../components/Pagination.jsx'
import Gallery from '../components/Gallery.jsx'
import AdminLayout from '../pages/admin/AdminLayout.jsx'
import ProductList from '../pages/admin/ProductList.jsx'

const inRouter = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>)

describe('Header (#1) and Footer (#7)', () => {
  it('shows logo + tagline linking home and the two account buttons', () => {
    inRouter(<Header />)
    expect(screen.getByRole('link', { name: /rumbo, ir al inicio/i })).toHaveAttribute('href', '/')
    expect(screen.getByText('Tu próxima escapada, a un clic')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Crear cuenta' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })

  it('footer shows isotype, current year and copyright', () => {
    render(<Footer />)
    expect(screen.getByRole('img', { name: 'Rumbo' })).toBeInTheDocument()
    expect(screen.getByText(new RegExp(`© ${new Date().getFullYear()} Rumbo`))).toBeInTheDocument()
  })
})

describe('Pagination (#8)', () => {
  it('shows the counter and disables first/back on page 1', async () => {
    const onChange = vi.fn()
    render(<Pagination page={0} totalPages={3} onChange={onChange} />)
    expect(screen.getByText('Página 1 de 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /primera página/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /anterior/i })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }))
    expect(onChange).toHaveBeenCalledWith(1)
  })

  it('goes back and to the first page from the last page', async () => {
    const onChange = vi.fn()
    render(<Pagination page={2} totalPages={3} onChange={onChange} />)
    expect(screen.getByRole('button', { name: /siguiente/i })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: /anterior/i }))
    await userEvent.click(screen.getByRole('button', { name: /primera página/i }))
    expect(onChange.mock.calls).toEqual([[1], [0]])
  })
})

describe('Gallery (#6)', () => {
  it('shows main + 4 images and "Ver más" opens every image', async () => {
    const images = Array.from({ length: 7 }, (_, i) => `https://img/${i}.jpg`)
    const { container } = render(<Gallery images={images} name="Cabaña" />)
    expect(container.querySelectorAll('.gallery-grid img')).toHaveLength(4)
    await userEvent.click(screen.getByRole('button', { name: 'Ver más' }))
    const dialog = container.querySelector('dialog')
    expect(dialog).toHaveAttribute('open')
    expect(within(dialog).getByText('Foto 1 de 7')).toBeInTheDocument()
    expect(dialog.querySelectorAll('.lightbox-thumbs img')).toHaveLength(7)
  })
})

describe('Admin panel (#9, #10, #11)', () => {
  it('includes the mobile notice and the admin menu', () => {
    inRouter(<Routes><Route path="*" element={<AdminLayout />} /></Routes>)
    expect(screen.getByText('El panel de administración no está disponible en dispositivos móviles')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /agregar producto/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /lista de productos/i })).toBeInTheDocument()
  })

  it('lists products and deletes one only after confirming', async () => {
    const rows = [{ id: 1, name: 'Cabaña Uno' }, { id: 2, name: 'Domo Dos' }]
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(rows), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    inRouter(<ProductList />)

    const table = await screen.findByRole('table')
    expect(within(table).getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Id', 'Nombre', 'Acciones'])

    await userEvent.click(screen.getByRole('button', { name: 'Eliminar producto Cabaña Uno' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.getByText('Cabaña Uno')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await userEvent.click(screen.getByRole('button', { name: 'Eliminar producto Cabaña Uno' }))
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    await waitFor(() => expect(screen.queryByText('Cabaña Uno')).not.toBeInTheDocument())
    expect(fetchMock).toHaveBeenLastCalledWith(expect.stringContaining('/api/admin/products/1'), { method: 'DELETE' })
    expect(screen.getByText('Domo Dos')).toBeInTheDocument()
    vi.unstubAllGlobals()
  })
})
