import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { formatPrice, imageSrc } from '../api.js'

export default function ProductCard({ product }) {
  const price = formatPrice(product.pricePerNight)
  return (
    <Link to={`/producto/${product.id}`} className="product-card">
      <div className="photo">
        {product.mainImage && <img src={imageSrc(product.mainImage)} alt="" loading="lazy" />}
      </div>
      <div className="body">
        {product.category && <span className="tag">{product.category}</span>}
        <h3>{product.name}</h3>
        {product.city && (
          <span className="map-label"><MapPin size={14} aria-hidden="true" />{product.city}</span>
        )}
        {price && <p className="price"><strong>{price}</strong> <span>/ noche</span></p>}
      </div>
    </Link>
  )
}
