export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/$/, '')

const OFFLINE = 'No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.'
const SESSION_KEY = 'rumbo.session'

/** Session = { token, user }. Kept in localStorage so a reload keeps the visitor signed in. */
export function readSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY))
  } catch {
    return null
  }
}

export function writeSession(session) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  else localStorage.removeItem(SESSION_KEY)
  window.dispatchEvent(new Event('rumbo:session'))
}

export async function api(path, options = {}) {
  const token = readSession()?.token
  const headers = { ...options.headers }
  if (token) headers.Authorization = `Bearer ${token}`
  if (options.json !== undefined) headers['Content-Type'] = 'application/json'
  const init = { ...options, headers, body: options.json !== undefined ? JSON.stringify(options.json) : options.body }
  delete init.json

  let res
  try {
    res = await fetch(API_URL + '/api' + path, init)
  } catch {
    throw Object.assign(new Error(OFFLINE), { status: 0, fields: {} })
  }
  if (!res.ok) {
    // An expired or revoked token: drop it so the app shows the visitor as signed out.
    if (res.status === 401 && token) writeSession(null)
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.message || OFFLINE), { status: res.status, fields: body.fields || {} })
  }
  return res.status === 204 || res.status === 202 ? null : res.json()
}

/** Uploaded images come back as /uploads/..., seed images are absolute URLs. */
export const imageSrc = (url) => (url?.startsWith('/uploads/') ? API_URL + url : url)

const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
export const formatPrice = (value) => (value == null ? null : cop.format(value))
