export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/$/, '')

const OFFLINE = 'No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.'

export async function api(path, options) {
  let res
  try {
    res = await fetch(API_URL + '/api' + path, options)
  } catch {
    throw Object.assign(new Error(OFFLINE), { status: 0, fields: {} })
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.message || OFFLINE), { status: res.status, fields: body.fields || {} })
  }
  return res.status === 204 ? null : res.json()
}

/** Uploaded images come back as /uploads/..., seed images are absolute URLs. */
export const imageSrc = (url) => (url?.startsWith('/uploads/') ? API_URL + url : url)

const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
export const formatPrice = (value) => (value == null ? null : cop.format(value))
