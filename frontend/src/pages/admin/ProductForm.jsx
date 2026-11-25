import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ImagePlus, X } from 'lucide-react'
import { toast } from 'sonner'
import { api, imageSrc } from '../../api.js'
import FeatureIcon from '../../components/FeatureIcon.jsx'
import { ADMIN } from './AdminLayout.jsx'

const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
const MAX_BYTES = 10 * 1024 * 1024

/** Register and edit products. With an :id in the URL it loads the product and saves with PUT. */
export default function ProductForm() {
  const { id } = useParams()
  const editing = id !== undefined
  const navigate = useNavigate()
  const [product, setProduct] = useState(editing ? null : {})
  const [loadError, setLoadError] = useState(null)
  const [options, setOptions] = useState({ categories: [], features: [] })
  const [kept, setKept] = useState([])
  const [files, setFiles] = useState([])
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(false)
  const previews = useObjectUrls(files)

  useEffect(() => {
    Promise.all([api('/categories'), api('/features')])
      .then(([categories, features]) => setOptions({ categories, features }))
      .catch((e) => toast.error(e.message))
  }, [])

  useEffect(() => {
    if (!editing) return
    api(`/products/${id}`)
      .then((p) => { setProduct(p); setKept(p.images) })
      .catch((e) => setLoadError(e.message))
  }, [editing, id])

  const addFiles = (list) => {
    const picked = [...list]
    const wrongType = picked.filter((f) => !TYPES.includes(f.type))
    const tooBig = picked.filter((f) => TYPES.includes(f.type) && f.size > MAX_BYTES)
    if (wrongType.length) toast.error(`${wrongType.map((f) => f.name).join(', ')}: usa JPG, PNG, WebP o AVIF.`)
    if (tooBig.length) toast.error(`${tooBig.map((f) => f.name).join(', ')}: supera 10 MB.`)
    setFiles((prev) => [...prev, ...picked.filter((f) => TYPES.includes(f.type) && f.size <= MAX_BYTES)])
    clearError('images')
  }

  const clearError = (name) => errors[name] && setErrors((e) => ({ ...e, [name]: undefined }))

  const onSubmit = async (e) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const found = {}
    if (!form.get('name').trim()) found.name = 'El nombre es obligatorio.'
    if (!form.get('description').trim()) found.description = 'La descripción es obligatoria.'
    if (kept.length + files.length === 0) found.images = 'Agrega al menos una imagen del producto.'
    setErrors(found)
    if (Object.keys(found).length) return

    form.delete('images')
    if (!form.get('categoryId')) form.delete('categoryId')
    kept.forEach((url) => form.append('keepImages', url))
    files.forEach((f) => form.append('images', f))
    setSending(true)
    try {
      const saved = await api(editing ? `/admin/products/${id}` : '/admin/products',
        { method: editing ? 'PUT' : 'POST', body: form })
      toast.success(editing ? `Guardaste los cambios de «${saved.name}».` : `«${saved.name}» ya está publicado.`)
      navigate(`${ADMIN}/productos`)
    } catch (err) {
      if (err.status === 409) setErrors({ name: err.message })
      else if (Object.keys(err.fields).length) setErrors(err.fields)
      else toast.error(err.message)
    } finally {
      setSending(false)
    }
  }

  if (loadError) {
    return (
      <div className="state" role="alert">
        <p>{loadError}</p>
        <Link className="btn btn-solid" to={`${ADMIN}/productos`}>Volver a la lista</Link>
      </div>
    )
  }
  if (!product) return <div className="skeleton skeleton-tall" aria-label="Cargando producto" />

  const fieldProps = (name) => ({
    id: name, name, 'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
  })
  const errorText = (name) => errors[name] && <p id={`${name}-error`} className="error">{errors[name]}</p>
  const featureIds = new Set(product.features?.map((f) => f.id))
  const photoCount = kept.length + files.length

  return (
    <>
      <h1>{editing ? 'Editar producto' : 'Agregar producto'}</h1>
      <p className="intro">{editing ? 'Cambia los datos, la categoría, las características o las fotos.' : 'Completa los datos del alojamiento. La primera foto será la principal.'}</p>
      {/* key: re-mount the inputs once the product being edited arrives, so defaultValue applies */}
      <form key={product.id ?? 'new'} className="form" onSubmit={onSubmit} noValidate
        onInput={(e) => clearError(e.target.name)}>
        <div className="field">
          <label htmlFor="name">Nombre</label>
          <input type="text" maxLength={120} defaultValue={product.name} {...fieldProps('name')} />
          {errorText('name')}
        </div>
        <div className="field">
          <label htmlFor="description">Descripción</label>
          <textarea maxLength={2000} defaultValue={product.description} {...fieldProps('description')} />
          {errorText('description')}
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="city">Ciudad <span className="hint">(opcional)</span></label>
            <input type="text" maxLength={80} defaultValue={product.city ?? ''} {...fieldProps('city')} />
          </div>
          <div className="field">
            <label htmlFor="address">Dirección <span className="hint">(opcional)</span></label>
            <input type="text" maxLength={200} defaultValue={product.address ?? ''} {...fieldProps('address')} />
          </div>
          <div className="field">
            <label htmlFor="pricePerNight">Precio por noche (COP) <span className="hint">(opcional)</span></label>
            <input type="number" min="0" step="1000" inputMode="numeric" defaultValue={product.pricePerNight ?? ''} {...fieldProps('pricePerNight')} />
            {errorText('pricePerNight')}
          </div>
        </div>
        <div className="field">
          <label htmlFor="categoryId">Categoría</label>
          <select defaultValue={product.category?.id ?? ''} {...fieldProps('categoryId')}
            key={`cat-${options.categories.length}`}>
            <option value="">Sin categoría</option>
            {options.categories.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <fieldset className="field">
          <legend>Características</legend>
          {options.features.length === 0 ? (
            <p className="hint">Todavía no hay características. Créalas en <Link to={`${ADMIN}/caracteristicas`}>Administrar características</Link>.</p>
          ) : (
            <ul className="feature-checks" key={`f-${options.features.length}`}>
              {options.features.map((f) => (
                <li key={f.id}>
                  <label>
                    <input type="checkbox" name="featureIds" value={f.id} defaultChecked={featureIds.has(f.id)} />
                    <FeatureIcon icon={f.icon} size={18} /> {f.name}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </fieldset>
        <fieldset className="field" aria-describedby={errors.images ? 'images-error' : undefined}>
          <legend>Imágenes</legend>
          <label className="dropzone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files) }}>
            <ImagePlus size={28} aria-hidden="true" />
            <span><strong>Elige una o varias fotos</strong> o arrástralas aquí</span>
            <span className="hint">JPG, PNG, WebP o AVIF, hasta 10 MB cada una</span>
            <input type="file" name="images" accept={TYPES.join(',')} multiple
              onChange={(e) => { addFiles(e.target.files); e.target.value = '' }} />
          </label>
          {errorText('images')}
          {photoCount > 0 && (
            <ul className="previews">
              {kept.map((url, i) => (
                <li key={url}>
                  <img src={imageSrc(url)} alt={`Foto actual ${i + 1}`} />
                  {i === 0 && <span className="badge">Principal</span>}
                  <button type="button" className="icon-btn remove" aria-label={`Quitar foto actual ${i + 1}`}
                    onClick={() => setKept((list) => list.filter((u) => u !== url))}>
                    <X size={16} aria-hidden="true" />
                  </button>
                </li>
              ))}
              {files.map((f, i) => (
                <li key={previews[i]}>
                  <img src={previews[i]} alt={`Vista previa: ${f.name}`} />
                  {kept.length === 0 && i === 0 && <span className="badge">Principal</span>}
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
          <button type="submit" className="btn btn-solid" disabled={sending}>
            {sending ? 'Guardando…' : editing ? 'Guardar cambios' : 'Guardar producto'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate(`${ADMIN}/productos`)}>Cancelar</button>
        </div>
      </form>
    </>
  )
}

export function useObjectUrls(files) {
  const urls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files])
  useEffect(() => () => urls.forEach(URL.revokeObjectURL), [urls])
  return urls
}
