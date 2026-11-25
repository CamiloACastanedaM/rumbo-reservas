import { useEffect, useRef } from 'react'

/** Native modal dialog: focus trap, Escape and backdrop handling come from the browser. */
export default function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onCancel, busy }) {
  const ref = useRef(null)

  useEffect(() => {
    const dialog = ref.current
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog ref={ref} className="confirm" aria-labelledby="confirm-title" aria-describedby="confirm-message"
      onCancel={(e) => { e.preventDefault(); onCancel() }}>
      <h2 id="confirm-title">{title}</h2>
      <p id="confirm-message">{message}</p>
      <div className="actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel} autoFocus>Cancelar</button>
        <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={busy}>
          {busy ? 'Eliminando…' : confirmLabel}
        </button>
      </div>
    </dialog>
  )
}
