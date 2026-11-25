import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="container page-section">
      <div className="state">
        <h1 className="section-title">Este camino no lleva a ningún lado</h1>
        <p>La página que buscas no existe o cambió de dirección.</p>
        <Link to="/" className="btn btn-solid">Volver al inicio</Link>
      </div>
    </div>
  )
}
