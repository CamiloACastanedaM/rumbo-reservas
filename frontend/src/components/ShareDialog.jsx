import { useState } from 'react'
import { Copy, Share2, X } from 'lucide-react'
import { toast } from 'sonner'
import { imageSrc } from '../api.js'
import useModalDialog from './useModalDialog.js'

const NETWORKS = [
  { id: 'facebook', name: 'Facebook', url: (link, text) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}&quote=${encodeURIComponent(text)}` },
  { id: 'x', name: 'X (Twitter)', url: (link, text) => `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}` },
  { id: 'whatsapp', name: 'WhatsApp', url: (link, text) => `https://wa.me/?text=${encodeURIComponent(`${text} ${link}`)}` },
  // Instagram has no web share link: the text is copied and the visitor pastes it there.
  { id: 'instagram', name: 'Instagram', url: null },
]

const shortText = (s, max = 160) => (s.length > max ? `${s.slice(0, max).replace(/\s+\S*$/, '')}…` : s)

export default function ShareDialog({ open, onClose, product }) {
  const ref = useModalDialog(open)
  const link = `${window.location.origin}/producto/${product.id}`
  const [network, setNetwork] = useState('whatsapp')
  const [message, setMessage] = useState('')
  const [openedFor, setOpenedFor] = useState(null)
  if (open && openedFor !== product) {
    setOpenedFor(product)
    setMessage(`Mira este alojamiento en Rumbo: ${product.name}${product.city ? `, en ${product.city}` : ''}.`)
  } else if (!open && openedFor) setOpenedFor(null)

  const copy = async (text, done) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(done)
      return true
    } catch {
      toast.error('No pudimos copiar. Selecciona el enlace y cópialo a mano.')
      return false
    }
  }

  const share = async () => {
    const target = NETWORKS.find((n) => n.id === network)
    if (target.url) {
      window.open(target.url(link, message), '_blank', 'noopener,noreferrer')
      onClose()
      return
    }
    if (await copy(`${message} ${link}`, 'Copiamos tu mensaje y el enlace. Pégalos en tu historia o en un mensaje de Instagram.')) {
      window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer')
      onClose()
    }
  }

  const nativeShare = () => navigator.share({ title: product.name, text: message, url: link })
    .then(onClose).catch(() => {}) // the visitor closed the system sheet

  return (
    <dialog ref={ref} className="confirm share-dialog" aria-labelledby="share-title"
      onCancel={(e) => { e.preventDefault(); onClose() }}>
      <div className="share-head">
        <h2 id="share-title">Compartir alojamiento</h2>
        <button type="button" className="icon-btn icon-btn-light" onClick={onClose} aria-label="Cerrar"><X size={18} aria-hidden="true" /></button>
      </div>
      <div className="share-preview">
        {product.images[0] && <img src={imageSrc(product.images[0])} alt={`Foto de ${product.name}`} />}
        <div>
          <strong>{product.name}</strong>
          <p>{shortText(product.description)}</p>
        </div>
      </div>
      <div className="field">
        <label htmlFor="share-link">Enlace directo</label>
        <div className="share-link">
          <input id="share-link" type="text" readOnly value={link} onFocus={(e) => e.target.select()} />
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => copy(link, 'Enlace copiado.')}>
            <Copy size={16} aria-hidden="true" /> Copiar
          </button>
        </div>
      </div>
      <div className="field">
        <label htmlFor="share-message">Tu mensaje</label>
        <textarea id="share-message" rows={3} maxLength={240} value={message} onChange={(e) => setMessage(e.target.value)} />
      </div>
      <fieldset className="field">
        <legend>¿Dónde quieres compartirlo?</legend>
        <div className="network-picker">
          {NETWORKS.map((n) => (
            <label key={n.id} className={`network network-${n.id}`}>
              <input type="radio" name="network" value={n.id} checked={network === n.id} onChange={() => setNetwork(n.id)} />
              <span className="network-dot" aria-hidden="true" />{n.name}
            </label>
          ))}
        </div>
        {network === 'instagram' && (
          <p className="hint">Instagram no permite publicar desde otra página: copiaremos tu mensaje con el enlace y abriremos Instagram para que lo pegues.</p>
        )}
      </fieldset>
      <div className="actions">
        {typeof navigator.share === 'function' && (
          <button type="button" className="btn btn-ghost" onClick={nativeShare}>Más opciones</button>
        )}
        <button type="button" className="btn btn-solid" onClick={share} disabled={!message.trim()}>
          <Share2 size={16} aria-hidden="true" /> Compartir en {NETWORKS.find((n) => n.id === network).name}
        </button>
      </div>
    </dialog>
  )
}
