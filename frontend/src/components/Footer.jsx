import Isotype from './Isotype.jsx'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-brand">
          <Isotype title="Rumbo" />
          <p>© {new Date().getFullYear()} Rumbo. Todos los derechos reservados.</p>
        </div>
        <p className="footer-note">Alojamientos en Colombia</p>
      </div>
    </footer>
  )
}
