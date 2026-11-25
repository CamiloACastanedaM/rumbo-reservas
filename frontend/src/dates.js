const shortDate = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' })

/** Local YYYY-MM-DD (toISOString would shift the day in Colombia's UTC-5). */
export const toIso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const fromIso = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
export const formatShort = (iso) => shortDate.format(fromIso(iso)).replace('.', '')
export const formatRange = (start, end) => `${formatShort(start)} – ${formatShort(end)}`
