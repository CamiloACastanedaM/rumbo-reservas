import { useEffect, useRef } from 'react'

/** Keeps a native <dialog> open as a modal while `open` is true. Returns the ref for the element. */
export default function useModalDialog(open) {
  const ref = useRef(null)
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])
  return ref
}
