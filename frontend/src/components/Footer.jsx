import Isotype from './Isotype.jsx'

const year = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-brand">
          <Isotype title="Rumbo" />
          <p>© {year} Rumbo. Todos los derechos reservados.</p>
        </div>
        <p className="footer-note">Alojamientos en Colombia</p>
      </div>
    </footer>
  )
}
