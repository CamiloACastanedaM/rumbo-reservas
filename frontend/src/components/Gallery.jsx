import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Images, X } from 'lucide-react'
import { imageSrc } from '../api.js'

export default function Gallery({ images, name }) {
  const [current, setCurrent] = useState(null)
  const dialog = useRef(null)
  const open = current !== null
  const [main, ...rest] = images

  useEffect(() => {
    const d = dialog.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  if (!main) return null
  const alt = (i) => `${name}, foto ${i + 1} de ${images.length}`
  const step = (delta) => setCurrent((c) => (c + delta + images.length) % images.length)
  const onKey = (e) => {
    if (e.key === 'ArrowRight') step(1)
    if (e.key === 'ArrowLeft') step(-1)
  }

  return (
    <section className="gallery" aria-label="Galería de fotos">
      <button type="button" className="gallery-main" onClick={() => setCurrent(0)} aria-label={`Ampliar ${alt(0)}`}>
        <img src={imageSrc(main)} alt={alt(0)} />
      </button>
      {rest.length > 0 && (
        <div className="gallery-grid">
          {rest.slice(0, 4).map((src, i) => (
            <button type="button" key={src} onClick={() => setCurrent(i + 1)} aria-label={`Ampliar ${alt(i + 1)}`}>
              <img src={imageSrc(src)} alt={alt(i + 1)} loading="lazy" />
            </button>
          ))}
        </div>
      )}
      <button type="button" className="btn btn-sm gallery-more" onClick={() => setCurrent(0)}>
        <Images size={16} aria-hidden="true" /> Ver más
      </button>

      <dialog ref={dialog} className="lightbox" aria-label={`Fotos de ${name}`}
        onClose={() => setCurrent(null)} onKeyDown={onKey}>
        {open && (
          <div className="lightbox-inner">
            <div className="lightbox-top">
              <span className="counter" aria-live="polite">Foto {current + 1} de {images.length}</span>
              <button type="button" className="icon-btn" onClick={() => setCurrent(null)} aria-label="Cerrar galería" autoFocus>
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <div className="lightbox-stage">
              <img key={current} src={imageSrc(images[current])} alt={alt(current)} />
              {images.length > 1 && (
                <>
                  <button type="button" className="icon-btn prev" onClick={() => step(-1)} aria-label="Foto anterior">
                    <ChevronLeft size={22} aria-hidden="true" />
                  </button>
                  <button type="button" className="icon-btn next" onClick={() => step(1)} aria-label="Foto siguiente">
                    <ChevronRight size={22} aria-hidden="true" />
                  </button>
                </>
              )}
            </div>
            <div className="lightbox-thumbs">
              {images.map((src, i) => (
                <button type="button" key={src} aria-current={i === current} onClick={() => setCurrent(i)}
                  aria-label={`Ver ${alt(i)}`}>
                  <img src={imageSrc(src)} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          </div>
        )}
      </dialog>
    </section>
  )
}
