import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// React Router (client-side navigation) never scrolls the window on its
// own — only full page loads do that natively. Without this, clicking a
// sidebar link while scrolled deep into a long table swaps the page's
// content behind the scroll position, so it looks like nothing happened
// until the user manually scrolls back up.
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])

  return null
}