import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// React Router (client-side navigation) never scrolls the window on its
// own — only full page loads do that natively. Without this, clicking a
// sidebar link while scrolled deep into a long table swaps the page's
// content behind the scroll position, so it looks like nothing happened
// until the user manually scrolls back up.
//
// Earlier versions of this component tried to work around the browser's
// scroll-anchoring behavior (which re-adjusts scroll position to
// compensate for layout shifts near the viewport) by re-asserting
// scrollTo(0, 0) on every animation frame for a fixed window after
// navigation. That was fighting a losing, timing-dependent battle: any
// layout shift after that window closed (a lazy chunk finishing load,
// admin content of a different height swapping in, async data arriving)
// could still silently undo the scroll. Scroll anchoring is now disabled
// app-wide in index.css instead, which is the actual fix, so a single
// scroll-to-top per navigation is all that's needed here.
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])

  return null
}