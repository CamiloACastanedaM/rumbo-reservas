import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../../api.js'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import { ADMIN } from './AdminLayout.jsx'

export default function ProductList() {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState(null)
  const [target, setTarget] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = () => {
    setError(null)
    api('/admin/products').then(setRows).catch((e) => setError(e.message))
  }
  useEffect(load, [])

  const remove = async () => {
    setBusy(true)
    try {
      await api(`/admin/products/${target.id}`, { method: 'DELETE' })
      setRows((r) => r.filter((p) => p.id !== target.id))
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
      <h1>Lista de productos</h1>
      <p className="intro">{rows ? `${rows.length} productos registrados.` : 'Cargando productos…'}</p>
      {error && (
        <div className="state" role="alert">
          <p>{error}</p>
          <button type="button" className="btn btn-solid" onClick={load}>Reintentar</button>
        </div>
      )}
      {rows?.length === 0 && (
        <div className="state">
          <p>No hay productos todavía.</p>
          <Link className="btn btn-solid" to={`${ADMIN}/productos/nuevo`}>Agregar producto</Link>
        </div>
      )}
      {rows?.length > 0 && (
        <table className="table">
          <thead>
            <tr><th className="col-id" scope="col">Id</th><th scope="col">Nombre</th><th className="col-actions" scope="col">Acciones</th></tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td className="col-id">{p.id}</td>
                <td><Link to={`/producto/${p.id}`}>{p.name}</Link></td>
                <td className="col-actions">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTarget(p)}
                    aria-label={`Eliminar producto ${p.name}`}>
                    <Trash2 size={16} aria-hidden="true" /> Eliminar producto
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <ConfirmDialog open={target !== null} busy={busy}
        title={target ? `¿Eliminar «${target.name}»?` : ''}
        message="El producto se borra de forma permanente y deja de aparecer en el sitio. Esta acción no se puede deshacer."
        confirmLabel="Eliminar" onConfirm={remove} onCancel={() => setTarget(null)} />
    </>
  )
}
