import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../../api.js'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import FeatureIcon, { FEATURE_ICONS } from '../../components/FeatureIcon.jsx'
import useModalDialog from '../../components/useModalDialog.js'

export default function FeatureAdmin() {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null) // {} = new, feature = edit
  const [target, setTarget] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = () => {
    setError(null)
    api('/features').then(setRows).catch((e) => setError(e.message))
  }
  useEffect(load, [])

  const saved = (feature, isNew) => {
    setRows((r) => (isNew ? [...r, feature] : r.map((f) => (f.id === feature.id ? feature : f)))
      .sort((a, b) => a.name.localeCompare(b.name, 'es')))
    toast.success(isNew ? `Añadiste «${feature.name}».` : `Guardaste «${feature.name}».`)
    setEditing(null)
  }

  const remove = async () => {
    setBusy(true)
    try {
      await api(`/admin/features/${target.id}`, { method: 'DELETE' })
      setRows((r) => r.filter((f) => f.id !== target.id))
      toast.success(`Eliminaste «${target.name}».`)
      setTarget(null)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="panel-head">
        <div>
          <h1>Administrar características</h1>
          <p className="intro">Lo que ofrece cada alojamiento: wifi, piscina, chimenea… Se asignan al agregar o editar un producto.</p>
        </div>
        <button type="button" className="btn btn-solid" onClick={() => setEditing({})}>
          <Plus size={18} aria-hidden="true" /> Añadir nueva
        </button>
      </div>
      {error && (
        <div className="state" role="alert">
          <p>{error}</p>
          <button type="button" className="btn btn-solid" onClick={load}>Reintentar</button>
        </div>
      )}
      {rows?.length === 0 && <div className="state"><p>Todavía no hay características.</p></div>}
      {rows?.length > 0 && (
        <table className="table">
          <thead>
            <tr><th scope="col" className="col-icon">Ícono</th><th scope="col">Nombre</th><th scope="col" className="col-actions">Acciones</th></tr>
          </thead>
          <tbody>
            {rows.map((f) => (
              <tr key={f.id}>
                <td className="col-icon"><span className="feature-chip"><FeatureIcon icon={f.icon} /></span></td>
                <td>{f.name}</td>
                <td className="col-actions">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(f)} aria-label={`Editar ${f.name}`}>
                    <Pencil size={16} aria-hidden="true" /> Editar
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTarget(f)} aria-label={`Eliminar ${f.name}`}>
                    <Trash2 size={16} aria-hidden="true" /> Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <FeatureDialog feature={editing} onClose={() => setEditing(null)} onSaved={saved} />
      <ConfirmDialog open={target !== null} busy={busy}
        title={target ? `¿Eliminar «${target.name}»?` : ''}
        message="La característica desaparece de la lista y de todos los alojamientos que la tienen."
        confirmLabel="Eliminar" onConfirm={remove} onCancel={() => setTarget(null)} />
    </>
  )
}

function FeatureDialog({ feature, onClose, onSaved }) {
  const open = feature !== null
  const ref = useModalDialog(open)
  const isNew = !feature?.id
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    const data = Object.fromEntries(new FormData(e.currentTarget))
    const found = {}
    if (!data.name?.trim()) found.name = 'El nombre es obligatorio.'
    if (!data.icon) found.icon = 'Elige un ícono.'
    setErrors(found)
    if (Object.keys(found).length) return
    setSending(true)
    try {
      const saved = await api(isNew ? '/admin/features' : `/admin/features/${feature.id}`,
        { method: isNew ? 'POST' : 'PUT', json: { name: data.name.trim(), icon: data.icon } })
      onSaved(saved, isNew)
    } catch (err) {
      if (err.status === 409) setErrors({ name: err.message })
      else if (Object.keys(err.fields).length) setErrors(err.fields)
      else toast.error(err.message)
    } finally {
      setSending(false)
    }
  }

  const close = () => { setErrors({}); onClose() }

  return (
    <dialog ref={ref} className="confirm form-dialog" aria-labelledby="feature-title"
      onCancel={(e) => { e.preventDefault(); close() }}>
      {open && (
        <form className="form" onSubmit={onSubmit} noValidate key={feature.id ?? 'new'}>
          <h2 id="feature-title">{isNew ? 'Añadir nueva característica' : 'Editar característica'}</h2>
          <div className="field">
            <label htmlFor="feature-name">Nombre</label>
            <input id="feature-name" name="name" type="text" maxLength={60} defaultValue={feature.name} autoFocus
              aria-invalid={errors.name ? true : undefined} aria-describedby={errors.name ? 'feature-name-error' : undefined} />
            {errors.name && <p id="feature-name-error" className="error">{errors.name}</p>}
          </div>
          <fieldset className="field" aria-describedby={errors.icon ? 'feature-icon-error' : undefined}>
            <legend>Ícono</legend>
            <div className="icon-picker">
              {FEATURE_ICONS.map(({ key, label, Icon }) => (
                <label key={key} title={label}>
                  <input type="radio" name="icon" value={key} defaultChecked={feature.icon === key} />
                  <Icon size={20} aria-hidden="true" />
                  <span className="sr-only">{label}</span>
                </label>
              ))}
            </div>
            {errors.icon && <p id="feature-icon-error" className="error">{errors.icon}</p>}
          </fieldset>
          <div className="actions">
            <button type="button" className="btn btn-ghost" onClick={close}>Cancelar</button>
            <button type="submit" className="btn btn-solid" disabled={sending}>{sending ? 'Guardando…' : 'Guardar'}</button>
          </div>
        </form>
      )}
    </dialog>
  )
}
