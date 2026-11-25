import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api, countLabel, imageSrc } from '../../api.js'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import useApi from '../../components/useApi.js'
import { ADMIN } from './AdminLayout.jsx'

const productsLabel = (n) => countLabel(n, 'producto', 'productos')

/** What deleting this category does, said before the admin confirms. */
const consequence = (c) => c.productCount === 0
  ? 'No tiene productos asociados. Dejará de aparecer en el inicio y en el filtro de categorías.'
  : `${productsLabel(c.productCount)} ${c.productCount === 1 ? 'quedará' : 'quedarán'} sin categoría: seguirán publicados y podrás asignarles otra al editarlos. La categoría dejará de aparecer en el inicio y en el filtro.`

export default function CategoryList() {
  const { state, setState, retry: load } = useApi('/admin/categories')
  const rows = state.data ?? null
  const error = state.status === 'error' ? state.message : null
  const setRows = (update) => setState((s) => ({ ...s, data: update(s.data) }))
  const [target, setTarget] = useState(null)
  const [busy, setBusy] = useState(false)


  const remove = async () => {
    setBusy(true)
    try {
      await api(`/admin/categories/${target.id}`, { method: 'DELETE' })
      setRows((r) => r.filter((c) => c.id !== target.id))
      toast.success(`Eliminaste la categoría «${target.title}».`)
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
          <h1>Lista de categorías</h1>
          <p className="intro">{rows ? `${rows.length} ${rows.length === 1 ? 'categoría' : 'categorías'}.` : 'Cargando categorías…'}</p>
        </div>
        <Link className="btn btn-solid" to={`${ADMIN}/categorias/nueva`}>Agregar categoría</Link>
      </div>
      {error && (
        <div className="state" role="alert">
          <p>{error}</p>
          <button type="button" className="btn btn-solid" onClick={load}>Reintentar</button>
        </div>
      )}
      {rows?.length === 0 && <div className="state"><p>No hay categorías todavía.</p></div>}
      {rows?.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th className="col-id" scope="col">Id</th>
              <th className="col-icon" scope="col"><span className="sr-only">Imagen</span></th>
              <th scope="col">Título</th>
              <th scope="col">Productos</th>
              <th className="col-actions" scope="col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td className="col-id">{c.id}</td>
                <td className="col-icon">{c.imageUrl && <img className="thumb" src={imageSrc(c.imageUrl)} alt="" />}</td>
                <td>{c.title}</td>
                <td className="nowrap">{productsLabel(c.productCount)}</td>
                <td className="col-actions">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTarget(c)}
                    aria-label={`Eliminar categoría ${c.title}`}>
                    <Trash2 size={16} aria-hidden="true" /> Eliminar categoría
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <ConfirmDialog open={target !== null} busy={busy}
        title={target ? `¿Eliminar la categoría «${target.title}»?` : ''}
        message={target ? `${consequence(target)} Esta acción no se puede deshacer.` : ''}
        confirmLabel="Confirmar" onConfirm={remove} onCancel={() => setTarget(null)} />
    </>
  )
}
