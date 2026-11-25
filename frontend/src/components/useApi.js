import { useEffect, useState } from 'react'
import { api } from '../api.js'

/**
 * GET `path` whenever it (or `key`) changes; a null path waits without asking. While reloading it keeps the last data, so lists don't flash.
 * state = { status: 'loading' | 'ok' | 'error', data?, message? }; retry() asks again.
 */
export default function useApi(path, key) {
  const [state, setState] = useState({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!path) return
    let alive = true
    setState((s) => ({ ...s, status: 'loading' }))
    api(path)
      .then((data) => alive && setState({ status: 'ok', data }))
      .catch((err) => alive && setState({ status: 'error', message: err.message }))
    return () => { alive = false }
  }, [path, key, attempt])

  return { state, setState, retry: () => setAttempt((a) => a + 1) }
}
