import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// React Router (client-side navigation) never scrolls the window on its
// own — only full page loads do that natively. Without this, clicking a
// sidebar link while scrolled deep into a long table swaps the page's
// content behind the scroll position, so it looks like nothing happened
// until the user manually scrolls back up.
//
// On mobile, the sidebar is a slide-in drawer that closes (via a CSS
// transition) at the same moment the route changes. That transition can
// trigger the browser's scroll-anchoring behavior — it tries to preserve
// the visual scroll position while nearby content resizes/animates — and
// that can silently fight a scrollTo that runs too early, before the
// drawer's closing animation and the new page's layout have settled.
// Running scrollTo on the next animation frame (after paint) instead of
// synchronously in the effect avoids that race.
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
    })
    return () => cancelAnimationFrame(frame)
  }, [pathname])

  return null
}