import { useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Receipt, ShieldCheck, Menu, Package } from 'lucide-react'
import Sidebar from './Sidebar'
import Header from './Header'
import { useProfile } from '../../hooks/useProfile'

export default function PageLayout({
  children,
  title,
  onAddItem,
  onAddYardProduct,
  onAddBundleProduct,
  onBulkAddProducts,
  onSellItem,
  onChangePassword,
  onInviteUser,
  onSettings,
  onAddSupplier,
  onAddLocation,
  onAddPurchaseOrder,
  onUpdateBudget,
}: {
  children: ReactNode
  title: string
  onAddItem?: () => void
  onAddYardProduct?: () => void
  onAddBundleProduct?: () => void
  onBulkAddProducts?: () => void
  onSellItem?: () => void
  onChangePassword?: () => void
  onInviteUser?: () => void
  onSettings?: () => void
  onAddSupplier?: () => void
  onAddLocation?: () => void
  onAddPurchaseOrder?: () => void
  onUpdateBudget?: () => void
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const location = useLocation()
  const { data: profile } = useProfile()
  const isAdmin = profile?.role === 'admin'

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        onAddItem={onAddItem}
        onAddYardProduct={onAddYardProduct}
        onAddBundleProduct={onAddBundleProduct}
        onBulkAddProducts={onBulkAddProducts}
        onSellItem={onSellItem}
        onChangePassword={onChangePassword}
        onInviteUser={onInviteUser}
        onSettings={onSettings}
        onAddSupplier={onAddSupplier}
        onAddLocation={onAddLocation}
        onAddPurchaseOrder={onAddPurchaseOrder}
        onUpdateBudget={onUpdateBudget}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="flex-1 pb-20 md:pb-6">
          <div className="max-w-7xl mx-auto p-3 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 px-3 py-1.5 flex items-center justify-around shadow-lg"
      >
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl text-[11px] font-medium transition-colors ${
              isActive
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`
          }
        >
          <LayoutDashboard size={19} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/pos"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl text-[11px] font-medium transition-colors ${
              isActive
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`
          }
        >
          <Receipt size={19} />
          <span>POS</span>
        </NavLink>

        {isAdmin ? (
          <NavLink
            to="/admin/overview"
            className={() => {
              const isAdminActive = location.pathname.startsWith('/admin')
              return `flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl text-[11px] font-medium transition-colors ${
                isAdminActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`
            }}
          >
            <ShieldCheck size={19} />
            <span>Admin</span>
          </NavLink>
        ) : (
          <NavLink
            to="/admin/orders"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl text-[11px] font-medium transition-colors ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`
            }
          >
            <Package size={19} />
            <span>Orders</span>
          </NavLink>
        )}

        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <Menu size={19} />
          <span>Menu</span>
        </button>
      </nav>
    </div>
  )
}