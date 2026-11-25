import { useEffect } from 'react'

/** While `open`, a press outside `ref` or the Escape key calls onClose (menus and popovers). */
export default function useDismiss(ref, open, onClose) {
  useEffect(() => {
    if (!open) return
    const onPointer = (e) => { if (!ref.current?.contains(e.target)) onClose() }
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [ref, open, onClose])
}
