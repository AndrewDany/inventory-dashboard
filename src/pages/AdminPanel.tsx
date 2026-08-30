import { Suspense, useEffect, useRef } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useInventory } from '../hooks/useInventory'
import { usePurchaseOrders } from '../hooks/usePurchaseOrders'
import { useUsers } from '../hooks/useUsers'
import PageLayout from '../components/layout/PageLayout'

export default function AdminPanel() {
  const { data: inventoryItems = [], isLoading: inventoryLoading } = useInventory()
  const { data: purchaseOrders = [], isLoading: purchaseOrdersLoading } = usePurchaseOrders()
  const { data: users = [], isLoading: usersLoading } = useUsers()

  const lowStockCount = inventoryItems.filter((item) => item.quantity <= item.reorder_level).length
  const pendingOrdersCount = purchaseOrders.filter(
    (order) => order.status !== 'received' && order.status !== 'cancelled',
  ).length
  const activeUsersCount = users.filter((user) => user.status === 'active').length
  const userHealthPercentage = users.length > 0 ? Math.round((activeUsersCount / users.length) * 100) : 0

  const statusText =
    lowStockCount > 0 || pendingOrdersCount > 0
      ? `${lowStockCount} low-stock items and ${pendingOrdersCount} open orders need attention.`
      : 'Inventory and purchasing are running smoothly with no critical issues.'

  const bannerLabel = lowStockCount > 0 || pendingOrdersCount > 0 ? 'Action required' : 'System health good'

  const isLoading = inventoryLoading || purchaseOrdersLoading || usersLoading

  // The banner is tall, so ScrollToTop putting the window at position 0
  // just shows the banner again -- the sidebar link's actual destination
  // is still hidden below it and needs a second, manual scroll. Once the
  // user is already inside the admin section, tapping another sidebar
  // link should instead bring this content card into view directly, so
  // the page they navigated to is what they actually see.
  //
  // The very first arrival at /admin should still show the banner, so
  // this only kicks in from the second navigation onward -- it skips
  // both the initial mount and the "/admin" -> "/admin/overview" index
  // redirect that happens on that first arrival.
  const location = useLocation()
  const contentRef = useRef<HTMLDivElement>(null)
  const prevPathRef = useRef<string | null>(null)

  useEffect(() => {
    const prevPath = prevPathRef.current
    prevPathRef.current = location.pathname

    if (prevPath === null || prevPath === '/admin') {
      return
    }

    const content = contentRef.current
    if (!content) return

    const header = document.querySelector('header')
    const headerHeight = header?.getBoundingClientRect().height ?? 0
    const gap = 16 // breathing room below the sticky header

    const targetTop = content.getBoundingClientRect().top + window.scrollY - headerHeight - gap
    window.scrollTo({ top: Math.max(targetTop, 0), left: 0, behavior: 'smooth' })
  }, [location.pathname])

  return (
    <PageLayout title="Admin Panel">
      <div className="space-y-6">
        <div className="overflow-hidden rounded-[32px] border border-indigo-200 bg-linear-to-br from-indigo-900 via-indigo-800 to-violet-700 p-6 text-white shadow-[0_24px_70px_rgba(79,70,229,0.18)] sm:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-100">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                {bannerLabel}
              </div>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white">
                Operations overview
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100">
                {isLoading ? 'Loading live admin metrics...' : statusText}
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  to="/admin/low-stock"
                  className="rounded-full bg-white px-4 py-2 text-sm font-medium text-indigo-800 transition hover:bg-indigo-50"
                >
                  Review low stock
                </Link>
                <Link
                  to="/admin/orders"
                  className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Open purchase orders
                </Link>
              </div>
            </div>

            <div className="grid w-full max-w-xl gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-100">Low stock</p>
                <p className="mt-2 text-2xl font-semibold text-white">{isLoading ? '--' : lowStockCount}</p>
                <p className="mt-1 text-xs text-indigo-100">Needs review</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-100">Orders</p>
                <p className="mt-2 text-2xl font-semibold text-white">{isLoading ? '--' : String(pendingOrdersCount).padStart(2, '0')}</p>
                <p className="mt-1 text-xs text-indigo-100">Pending</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-100">Users</p>
                <p className="mt-2 text-2xl font-semibold text-white">{isLoading ? '--' : `${userHealthPercentage}%`}</p>
                <p className="mt-1 text-xs text-indigo-100">Active</p>
              </div>
            </div>
          </div>
        </div>

        {/* Page content from nested route.
            This has its own Suspense boundary so that switching between
            admin sub-pages (each lazy-loaded in App.tsx) only shows a
            local loader here while the chunk fetches. Without this, the
            nearest boundary was the app-wide one in App.tsx, which
            unmounts this entire shell -- banner, sidebar, and header
            included -- while a not-yet-loaded sub-page's chunk downloads.
            That collapses the page to the tiny full-screen spinner and
            then pops it back to full height once the chunk resolves, and
            that later layout shift is what was leaving the scroll
            position stuck part-way down the page. */}
        <div ref={contentRef} className="rounded-[24px] border border-slate-200/80 bg-white/95 shadow-[0_16px_45px_rgba(15,23,42,0.06)] p-6">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-24">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </div>
      </div>
    </PageLayout>
  )
}