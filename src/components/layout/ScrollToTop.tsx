import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// React Router (client-side navigation) never scrolls the window on its
// own — only full page loads do that natively. Without this, clicking a
// sidebar link while scrolled deep into a long table swaps the page's
// content behind the scroll position, so it looks like nothing happened
// until the user manually scrolls back up.
//
// On mobile, the sidebar is a slide-in drawer that closes via a 200ms
// CSS transition (see Sidebar.tsx's `transition-all duration-200`) at
// the same moment the route changes. That transition can trigger the
// browser's scroll-anchoring behavior — it tries to preserve the visual
// scroll position while nearby content resizes/animates — and it can
// keep re-adjusting scroll position for the full duration of that
// transition, silently undoing a scrollTo that only ran once, early.
//
// A single requestAnimationFrame (~16ms) fires long before a 200ms
// transition finishes, so it isn't enough on its own. Instead: scroll
// immediately, then keep re-asserting scroll-to-top on every frame
// until just past the drawer's transition duration, so nothing the
// browser does mid-animation can silently override it.
const DRAWER_TRANSITION_MS = 200
const REASSERT_BUFFER_MS = 100 // margin past the transition, for slower devices

export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    // TEMPORARY DIAGNOSTIC LOGGING — remove once the mobile scroll issue
    // is confirmed fixed. Open the browser console while testing to see
    // exactly what scrollY is doing on each attempt.
    // eslint-disable-next-line no-console
    console.log(`[ScrollToTop] pathname changed to "${pathname}", scrollY before: ${window.scrollY}`)

    const scrollTop = () => window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
    const start = performance.now()
    let frame: number
    let ticks = 0

    const tick = () => {
      scrollTop()
      ticks += 1
      const elapsed = performance.now() - start
      if (elapsed < DRAWER_TRANSITION_MS + REASSERT_BUFFER_MS) {
        frame = requestAnimationFrame(tick)
      } else {
        // eslint-disable-next-line no-console
        console.log(
          `[ScrollToTop] done after ${ticks} ticks (~${elapsed.toFixed(0)}ms), final scrollY: ${window.scrollY}`
        )
      }
    }
    frame = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(frame)
  }, [pathname])

  return null
}