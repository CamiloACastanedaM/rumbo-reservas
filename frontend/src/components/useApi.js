import { useEffect, useState } from 'react'
import { api } from '../api.js'

/**
 * GET `path` whenever it (or `key`) changes; a null path waits without asking. While reloading it keeps the last data, so lists don't flash.
 * state = { status: 'loading' | 'ok' | 'error', data?, message? }; retry() asks again.
 */
export default function useApi(path, key) {
  const [attempt, setAttempt] = useState(0)
  const request = `${path}|${key}|${attempt}`
  const [result, setResult] = useState({ status: 'loading' })

  useEffect(() => {
    if (!path) return
    let alive = true
    api(path)
      .then((data) => alive && setResult({ request, status: 'ok', data }))
      .catch((err) => alive && setResult({ request, status: 'error', message: err.message }))
    return () => { alive = false }
  }, [path, request])

  // A result for an older request reads as loading, keeping its data on screen.
  const state = !path || result.request === request ? result : { status: 'loading', data: result.data }
  const setState = (update) => setResult((r) => ({ ...(typeof update === 'function' ? update(r) : update), request: r.request }))
  return { state, setState, retry: () => setAttempt((a) => a + 1) }
}
