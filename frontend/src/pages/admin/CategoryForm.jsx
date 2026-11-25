import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ImagePlus, X } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../../api.js'
import { ADMIN } from './AdminLayout.jsx'
import { useObjectUrls } from './ProductForm.jsx'

const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
const MAX_BYTES = 10 * 1024 * 1024

export default function CategoryForm() {
  const navigate = useNavigate()
  const [image, setImage] = useState(null)
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(false)
  const [preview] = useObjectUrls(image ? [image] : [])

  const pick = (file) => {
    if (!file) return
    if (!TYPES.includes(file.type)) return toast.error(`${file.name}: usa JPG, PNG, WebP o AVIF.`)
    if (file.size > MAX_BYTES) return toast.error(`${file.name}: supera 10 MB.`)
    setImage(file)
    setErrors((e) => ({ ...e, image: undefined }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const found = {}
    if (!form.get('title').trim()) found.title = 'El título es obligatorio.'
    if (!form.get('description').trim()) found.description = 'La descripción es obligatoria.'
    if (!image) found.image = 'Agrega una imagen representativa de la categoría.'
    setErrors(found)
    if (Object.keys(found).length) return

    form.set('image', image)
    setSending(true)
    try {
      const saved = await api('/admin/categories', { method: 'POST', body: form })
      toast.success(`La categoría «${saved.title}» ya aparece en el inicio.`)
      navigate(ADMIN)
    } catch (err) {
      if (err.status === 409) setErrors({ title: err.message })
      else if (Object.keys(err.fields).length) setErrors(err.fields)
      else toast.error(err.message)
    } finally {
      setSending(false)
    }
  }

  const fieldProps = (name) => ({
    id: name, name, 'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
  })
  const errorText = (name) => errors[name] && <p id={`${name}-error`} className="error">{errors[name]}</p>

  return (
    <>
      <h1>Agregar categoría</h1>
      <p className="intro">Las categorías agrupan los alojamientos en el inicio y en el filtro de resultados.</p>
      <form className="form" onSubmit={onSubmit} noValidate
        onInput={(e) => errors[e.target.name] && setErrors((x) => ({ ...x, [e.target.name]: undefined }))}>
        <div className="field">
          <label htmlFor="title">Título</label>
          <input type="text" maxLength={80} {...fieldProps('title')} />
          {errorText('title')}
        </div>
        <div className="field">
          <label htmlFor="description">Descripción</label>
          <textarea maxLength={500} {...fieldProps('description')} />
          {errorText('description')}
        </div>
        <fieldset className="field" aria-describedby={errors.image ? 'image-error' : undefined}>
          <legend>Imagen representativa</legend>
          {image ? (
            <ul className="previews">
              <li>
                <img src={preview} alt={`Vista previa: ${image.name}`} />
                <button type="button" className="icon-btn remove" aria-label={`Quitar ${image.name}`}
                  onClick={() => setImage(null)}>
                  <X size={16} aria-hidden="true" />
                </button>
              </li>
            </ul>
          ) : (
            <label className="dropzone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files[0]) }}>
              <ImagePlus size={28} aria-hidden="true" />
              <span><strong>Elige una foto</strong> o arrástrala aquí</span>
              <span className="hint">JPG, PNG, WebP o AVIF, hasta 10 MB</span>
              <input type="file" name="image" accept={TYPES.join(',')}
                onChange={(e) => { pick(e.target.files[0]); e.target.value = '' }} />
            </label>
          )}
          {errorText('image')}
        </fieldset>
        <div className="form-actions">
          <button type="submit" className="btn btn-solid" disabled={sending}>{sending ? 'Guardando…' : 'Guardar categoría'}</button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate(ADMIN)}>Cancelar</button>
        </div>
      </form>
    </>
  )
}
