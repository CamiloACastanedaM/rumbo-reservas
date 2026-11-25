import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { FolderPlus, Folders, List, Monitor, PlusSquare, ShieldAlert, Sparkles, Users } from 'lucide-react'
import { useAuth } from '../../auth.jsx'

export const ADMIN = '/administracion'

const MENU = [
  { to: 'productos/nuevo', label: 'Agregar producto', Icon: PlusSquare },
  { to: 'productos', label: 'Lista de productos', Icon: List, end: true },
  { to: 'categorias/nueva', label: 'Agregar categoría', Icon: FolderPlus },
  { to: 'categorias', label: 'Lista de categorías', Icon: Folders, end: true },
  { to: 'caracteristicas', label: 'Administrar características', Icon: Sparkles },
  { to: 'usuarios', label: 'Usuarios y permisos', Icon: Users },
]

export default function AdminLayout() {
  const { user, isAdmin } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/iniciar-sesion" replace
      state={{ from: location.pathname, message: 'Inicia sesión con una cuenta de administrador para entrar al panel.' }} />
  }
  if (!isAdmin) {
    return (
      <div className="container page-section">
        <div className="state" role="alert">
          <ShieldAlert size={32} aria-hidden="true" className="state-icon" />
          <h1 className="section-title">No tienes permisos de administrador</h1>
          <p>Tu cuenta puede explorar y reservar alojamientos, pero el panel es solo para administradores.</p>
          <NavLink to="/" className="btn btn-solid">Volver al inicio</NavLink>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="admin-mobile-note state" role="status">
        <Monitor size={32} aria-hidden="true" className="state-icon" />
        <p>El panel de administración no está disponible en dispositivos móviles</p>
      </div>
      <div className="admin-shell">
        <nav className="admin-nav" aria-label="Administración">
          <h2>Administración</h2>
          <ul>
            {MENU.map(({ to, label, Icon, end }) => (
              <li key={to}><NavLink to={to} end={end}><Icon size={18} aria-hidden="true" /> {label}</NavLink></li>
            ))}
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
      <p className="intro">Desde aquí gestionas los alojamientos, las categorías, las características y los permisos.</p>
      <div className="admin-home-actions">
        {MENU.map(({ to, label, Icon }, i) => (
          <NavLink key={to} to={to} className={`btn ${i === 0 ? 'btn-solid' : 'btn-ghost'}`}>
            <Icon size={18} aria-hidden="true" /> {label}
          </NavLink>
        ))}
      </div>
    </>
  )
}
