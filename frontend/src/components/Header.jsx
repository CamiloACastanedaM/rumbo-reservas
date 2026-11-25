import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, LayoutDashboard, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import Isotype from './Isotype.jsx'
import { initials, useAuth } from '../auth.jsx'

export default function Header() {
  const { user, isAdmin } = useAuth()
  return (
    <header className="site-header">
      <div className="container">
        <Link to="/" className="brand" aria-label="Rumbo, ir al inicio">
          <Isotype className="brand-mark" />
          <span className="brand-text">
            <span className="brand-name">rumbo</span>
            <span className="brand-tagline">Tu próxima escapada, a un clic</span>
          </span>
        </Link>
        {user ? (
          <nav className="header-actions header-user" aria-label="Cuenta">
            {isAdmin && (
              <Link to="/administracion" className="btn btn-ghost">
                <LayoutDashboard size={16} aria-hidden="true" /> Administración
              </Link>
            )}
            <UserMenu user={user} />
          </nav>
        ) : (
          <nav className="header-actions" aria-label="Cuenta">
            <Link to="/registro" className="btn btn-ghost">Crear cuenta</Link>
            <Link to="/iniciar-sesion" className="btn btn-light">Iniciar sesión</Link>
          </nav>
        )}
      </div>
    </header>
  )
}

function UserMenu({ user }) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const signOut = () => {
    setOpen(false)
    logout()
    toast.success('Cerraste sesión. Puedes seguir explorando alojamientos.')
    if (pathname.startsWith('/administraci')) navigate('/')
  }

  return (
    <div className="user-menu" ref={ref}>
      <button type="button" className="user-trigger" aria-expanded={open} aria-haspopup="true"
        aria-controls="user-menu-panel" onClick={() => setOpen((o) => !o)}>
        <span className="avatar" aria-hidden="true">{initials(user)}</span>
        <span className="user-name">{user.firstName} {user.lastName}</span>
        <ChevronDown size={16} aria-hidden="true" className="chevron" />
      </button>
      <div id="user-menu-panel" className="user-panel" hidden={!open}>
        <p className="user-panel-head">
          <strong>{user.firstName} {user.lastName}</strong>
          <span>{user.email}</span>
        </p>
        <button type="button" className="menu-item" onClick={signOut}>
          <LogOut size={16} aria-hidden="true" /> Cerrar sesión
        </button>
      </div>
    </div>
  )
}
