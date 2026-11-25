import { Link } from 'react-router-dom'
import Isotype from './Isotype.jsx'

export default function Header() {
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
        <nav className="header-actions" aria-label="Cuenta">
          <button type="button" className="btn btn-ghost">Crear cuenta</button>
          <button type="button" className="btn btn-light">Iniciar sesión</button>
        </nav>
      </div>
    </header>
  )
}
