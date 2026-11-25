import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { formatPrice, imageSrc } from '../api.js'
import FavoriteButton from './FavoriteButton.jsx'
import { RatingSummary } from './Rating.jsx'

export default function ProductCard({ product }) {
  const price = formatPrice(product.pricePerNight)
  return (
    <div className="product-card-wrap">
      <Link to={`/producto/${product.id}`} className="product-card">
        <div className="photo">
          {product.mainImage && <img src={imageSrc(product.mainImage)} alt="" loading="lazy"
            onError={(e) => { e.currentTarget.hidden = true }} />}
        </div>
        <div className="body">
          {product.category && <span className="tag">{product.category}</span>}
          <h3>{product.name}</h3>
          {product.city && (
            <span className="map-label"><MapPin size={14} aria-hidden="true" />{product.city}</span>
          )}
          <RatingSummary rating={product.rating} />
          {price && <p className="price"><strong>{price}</strong> <span>/ noche</span></p>}
        </div>
      </Link>
      <FavoriteButton product={product} className="on-photo" />
    </div>
  )
}
