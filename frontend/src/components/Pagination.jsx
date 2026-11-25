import { ChevronLeft, ChevronRight, ChevronsLeft } from 'lucide-react'

/** page is 0-based; the counter shows it 1-based. */
export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  const isFirst = page === 0
  const isLast = page >= totalPages - 1
  return (
    <nav className="pagination" aria-label="Paginación de recomendaciones">
      <button type="button" className="btn btn-ghost btn-sm" disabled={isFirst} onClick={() => onChange(0)}>
        <ChevronsLeft size={16} aria-hidden="true" /> Primera página
      </button>
      <button type="button" className="btn btn-ghost btn-sm" disabled={isFirst} onClick={() => onChange(page - 1)}>
        <ChevronLeft size={16} aria-hidden="true" /> Anterior
      </button>
      <span className="counter" aria-live="polite">Página {page + 1} de {totalPages}</span>
      <button type="button" className="btn btn-ghost btn-sm" disabled={isLast} onClick={() => onChange(page + 1)}>
        Siguiente <ChevronRight size={16} aria-hidden="true" />
      </button>
    </nav>
  )
}
