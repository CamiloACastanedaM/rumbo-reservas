import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** New routes start at the top; paging inside the same route keeps its own scroll handling. */
export default function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}
