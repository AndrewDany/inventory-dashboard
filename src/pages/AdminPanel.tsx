import { Link, Outlet } from 'react-router-dom'
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

        {/* Page content from nested route */}
        <div className="rounded-[24px] border border-slate-200/80 bg-white/95 shadow-[0_16px_45px_rgba(15,23,42,0.06)] p-6">
          <Outlet />
        </div>
      </div>
    </PageLayout>
  )
}

