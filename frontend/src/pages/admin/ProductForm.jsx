import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ImagePlus, X } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../../api.js'
import { ADMIN } from './AdminLayout.jsx'

const ACCEPT = 'image/jpeg,image/png,image/webp,image/avif'
const MAX_BYTES = 10 * 1024 * 1024

export default function ProductForm() {
  const navigate = useNavigate()
  const [files, setFiles] = useState([])
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(false)
  const previews = useObjectUrls(files)

  const addFiles = (list) => {
    const picked = [...list]
    const tooBig = picked.filter((f) => f.size > MAX_BYTES)
    if (tooBig.length) toast.error(`${tooBig.map((f) => f.name).join(', ')}: supera 10 MB.`)
    setFiles((prev) => [...prev, ...picked.filter((f) => f.size <= MAX_BYTES && ACCEPT.includes(f.type))])
    setErrors((e) => ({ ...e, images: undefined }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const found = {}
    if (!form.get('name').trim()) found.name = 'El nombre es obligatorio.'
    if (!form.get('description').trim()) found.description = 'La descripción es obligatoria.'
    if (files.length === 0) found.images = 'Agrega al menos una imagen del producto.'
    setErrors(found)
    if (Object.keys(found).length) return

    form.delete('images')
    files.forEach((f) => form.append('images', f))
    setSending(true)
    try {
      const created = await api('/admin/products', { method: 'POST', body: form })
      toast.success(`«${created.name}» ya está publicado.`)
      navigate(`${ADMIN}/productos`)
    } catch (err) {
      if (err.status === 409) setErrors({ name: err.message })
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
  const ErrorText = ({ name }) => errors[name] ? <p id={`${name}-error`} className="error">{errors[name]}</p> : null

  return (
    <>
      <h1>Agregar producto</h1>
      <p className="intro">Completa los datos del alojamiento. La primera foto será la principal.</p>
      <form className="form" onSubmit={onSubmit} noValidate
        onInput={(e) => errors[e.target.name] && setErrors((er) => ({ ...er, [e.target.name]: undefined }))}>
        <div className="field">
          <label htmlFor="name">Nombre</label>
          <input type="text" maxLength={120} {...fieldProps('name')} />
          <ErrorText name="name" />
        </div>
        <div className="field">
          <label htmlFor="description">Descripción</label>
          <textarea maxLength={2000} {...fieldProps('description')} />
          <ErrorText name="description" />
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="city">Ciudad <span className="hint">(opcional)</span></label>
            <input type="text" maxLength={80} {...fieldProps('city')} />
          </div>
          <div className="field">
            <label htmlFor="address">Dirección <span className="hint">(opcional)</span></label>
            <input type="text" maxLength={200} {...fieldProps('address')} />
          </div>
          <div className="field">
            <label htmlFor="pricePerNight">Precio por noche (COP) <span className="hint">(opcional)</span></label>
            <input type="number" min="0" step="1000" inputMode="numeric" {...fieldProps('pricePerNight')} />
            <ErrorText name="pricePerNight" />
          </div>
        </div>
        <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }} aria-describedby={errors.images ? 'images-error' : undefined}>
          <legend>Imágenes</legend>
          <label className="dropzone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files) }}>
            <ImagePlus size={28} aria-hidden="true" />
            <span><strong>Elige una o varias fotos</strong> o arrástralas aquí</span>
            <span className="hint">JPG, PNG, WebP o AVIF, hasta 10 MB cada una</span>
            <input type="file" name="images" accept={ACCEPT} multiple
              onChange={(e) => { addFiles(e.target.files); e.target.value = '' }} />
          </label>
          <ErrorText name="images" />
          {files.length > 0 && (
            <ul className="previews">
              {files.map((f, i) => (
                <li key={previews[i]}>
                  <img src={previews[i]} alt={`Vista previa ${i + 1}: ${f.name}`} />
                  {i === 0 && <span className="badge">Principal</span>}
                  <button type="button" className="icon-btn remove" aria-label={`Quitar ${f.name}`}
                    onClick={() => setFiles((list) => list.filter((_, j) => j !== i))}>
                    <X size={16} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </fieldset>
        <div className="form-actions">
          <button type="submit" className="btn btn-solid" disabled={sending}>{sending ? 'Guardando…' : 'Guardar producto'}</button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate(`${ADMIN}/productos`)}>Cancelar</button>
        </div>
      </form>
    </>
  )
}

function useObjectUrls(files) {
  const [urls, setUrls] = useState([])
  useEffect(() => {
    const next = files.map((f) => URL.createObjectURL(f))
    setUrls(next)
    return () => next.forEach(URL.revokeObjectURL)
  }, [files])
  return urls
}
