import { useEffect, useState } from 'react'
import { ShieldCheck, ShieldOff } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../../api.js'
import { useAuth } from '../../auth.jsx'

export default function UserAdmin() {
  const { user: me } = useAuth()
  const [rows, setRows] = useState(null)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const load = () => {
    setError(null)
    api('/admin/users').then(setRows).catch((e) => setError(e.message))
  }
  useEffect(load, [])

  const setRole = async (u, role) => {
    setBusyId(u.id)
    try {
      const saved = await api(`/admin/users/${u.id}/role`, { method: 'PATCH', json: { role } })
      setRows((r) => r.map((x) => (x.id === saved.id ? saved : x)))
      toast.success(role === 'ADMIN'
        ? `${saved.firstName} ${saved.lastName} ahora es administrador.`
        : `${saved.firstName} ${saved.lastName} ya no es administrador.`)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <h1>Usuarios y permisos</h1>
      <p className="intro">
        {rows ? `${rows.length} ${rows.length === 1 ? 'usuario registrado' : 'usuarios registrados'}. ` : 'Cargando usuarios… '}
        Los administradores pueden gestionar productos, categorías, características y permisos.
      </p>
      {error && (
        <div className="state" role="alert">
          <p>{error}</p>
          <button type="button" className="btn btn-solid" onClick={load}>Reintentar</button>
        </div>
      )}
      {rows?.length > 0 && (
        <table className="table">
          <thead>
            <tr><th scope="col">Nombre</th><th scope="col">Correo</th><th scope="col">Rol</th><th scope="col" className="col-actions">Acciones</th></tr>
          </thead>
          <tbody>
            {rows.map((u) => {
              const admin = u.role === 'ADMIN'
              return (
                <tr key={u.id}>
                  <td>{u.firstName} {u.lastName}</td>
                  <td>{u.email}</td>
                  <td><span className={`role-badge${admin ? ' is-admin' : ''}`}>{admin ? 'Administrador' : 'Usuario'}</span></td>
                  <td className="col-actions">
                    {u.id === me.id ? (
                      <span className="muted">Tú</span>
                    ) : (
                      <button type="button" className="btn btn-ghost btn-sm" disabled={busyId === u.id}
                        onClick={() => setRole(u, admin ? 'USER' : 'ADMIN')}
                        aria-label={`${admin ? 'Quitar rol de administrador a' : 'Dar rol de administrador a'} ${u.firstName} ${u.lastName}`}>
                        {admin ? <ShieldOff size={16} aria-hidden="true" /> : <ShieldCheck size={16} aria-hidden="true" />}
                        {admin ? 'Quitar administrador' : 'Hacer administrador'}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </>
  )
}
