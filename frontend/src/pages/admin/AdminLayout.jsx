import { NavLink, Outlet } from 'react-router-dom'
import { List, Monitor, PlusSquare } from 'lucide-react'

export const ADMIN = '/administracion'

export default function AdminLayout() {
  return (
    <div className="container">
      <div className="admin-mobile-note state" role="status">
        <Monitor size={32} aria-hidden="true" style={{ margin: '0 auto var(--space-3)' }} />
        <p>El panel de administración no está disponible en dispositivos móviles</p>
      </div>
      <div className="admin-shell">
        <nav className="admin-nav" aria-label="Administración">
          <h2>Administración</h2>
          <ul>
            <li><NavLink to="productos/nuevo"><PlusSquare size={18} aria-hidden="true" /> Agregar producto</NavLink></li>
            <li><NavLink to="productos" end><List size={18} aria-hidden="true" /> Lista de productos</NavLink></li>
          </ul>
        </nav>
        <section className="admin-panel">
          <Outlet />
        </section>
      </div>
    </div>
  )
}

export function AdminHome() {
  return (
    <>
      <h1>Panel de administración</h1>
      <p className="intro">Desde aquí gestionas los alojamientos que ven los viajeros.</p>
      <div className="admin-home-actions">
        <NavLink to="productos/nuevo" className="btn btn-solid"><PlusSquare size={18} aria-hidden="true" /> Agregar producto</NavLink>
        <NavLink to="productos" className="btn btn-ghost"><List size={18} aria-hidden="true" /> Lista de productos</NavLink>
      </div>
    </>
  )
}
