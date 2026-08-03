import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ShieldCheck,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  PackagePlus,
  KeyRound,
  UserPlus,
  Settings,
  Truck,
  MapPin,
  ClipboardList,
  Receipt,
  FileText,
  Users,
  Package,
  ShoppingCart,
  AlertTriangle,
  ArrowLeftRight,
  Layers,
  Scale,
  RotateCcw,
  Activity,
  SearchCheck,
  BarChart3,
  DollarSign,
} from 'lucide-react'
import { useProfile } from '../../hooks/useProfile'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  isCollapsed: boolean
  onToggleCollapse: () => void
  onAddItem?: () => void
  onBulkAddProducts?: () => void
  onChangePassword?: () => void
  onInviteUser?: () => void
  onSettings?: () => void
  onAddSupplier?: () => void
  onAddLocation?: () => void
  onAddPurchaseOrder?: () => void
}

type AdminSubLink = {
  path: string
  label: string
  icon: React.ReactNode
}

const adminSubLinks: AdminSubLink[] = [
  { path: '/admin/overview', label: 'Overview', icon: <FileText size={16} /> },
  { path: '/admin/locations', label: 'Locations', icon: <MapPin size={16} /> },
  { path: '/admin/users', label: 'Users', icon: <Users size={16} /> },
  { path: '/admin/orders', label: 'Orders', icon: <Package size={16} /> },
  { path: '/admin/sales-orders', label: 'Sales Orders', icon: <ShoppingCart size={16} /> },
  { path: '/admin/low-stock', label: 'Low Stock', icon: <AlertTriangle size={16} /> },
  { path: '/admin/suppliers', label: 'Suppliers', icon: <Truck size={16} /> },
  { path: '/admin/movements', label: 'Movements', icon: <ArrowLeftRight size={16} /> },
  { path: '/admin/batches', label: 'Batches', icon: <Layers size={16} /> },
  { path: '/admin/returns', label: 'Returns', icon: <RotateCcw size={16} /> },
  { path: '/admin/adjustments', label: 'Adjustments', icon: <Scale size={16} /> },
  { path: '/admin/valuation', label: 'Valuation', icon: <DollarSign size={16} /> },
  { path: '/admin/activity', label: 'Activity', icon: <Activity size={16} /> },
  { path: '/admin/audit-events', label: 'Audit Events', icon: <SearchCheck size={16} /> },
  { path: '/admin/reports', label: 'Reports', icon: <BarChart3 size={16} /> },
  { path: '/admin/financials', label: 'P&L', icon: <DollarSign size={16} /> },
]

export default function Sidebar({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
  onAddItem,
  onBulkAddProducts,
  onChangePassword,
  onInviteUser,
  onSettings,
  onAddSupplier,
  onAddLocation,
  onAddPurchaseOrder,
}: SidebarProps) {
  const location = useLocation()
  const { data: profile } = useProfile()
  const isAdmin = profile?.role === 'admin'
  const isAdminPage = location.pathname.startsWith('/admin')

  const linkClass = (path: string) => {
    const active = location.pathname === path
    return `group flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-sm font-medium transition-all ${
      active
        ? 'border-white/15 bg-white/15 text-white shadow-[0_10px_25px_rgba(15,23,42,0.18)]'
        : 'border-transparent text-slate-200 hover:border-white/10 hover:bg-white/10 hover:text-white'
    } ${isCollapsed ? 'justify-center px-3' : ''}`
  }

  const actionClass = `flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-white/15 ${isCollapsed ? 'justify-center px-3' : ''}`

  const adminSubLinkClass = (path: string) => {
    const active = location.pathname === path
    return `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
      active
        ? 'bg-indigo-600/20 text-indigo-200'
        : 'text-slate-300 hover:bg-white/5 hover:text-white'
    } ${isCollapsed ? 'justify-center px-2' : ''}`
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/45 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen flex-col justify-between overflow-hidden border-r border-white/10 bg-gradient-to-b from-indigo-800 via-indigo-700 to-indigo-600 text-slate-100 shadow-[20px_0_60px_rgba(2,6,23,0.35)] transition-all duration-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'w-24' : 'w-72'} md:sticky md:top-0 md:h-screen md:translate-x-0 md:shrink-0 ${
          isCollapsed ? 'md:w-24' : 'md:w-72'
        }`}
      >
        <div className="flex-1 overflow-y-auto px-4 py-5">
          <div
            className={`mb-6 flex ${isCollapsed ? 'flex-col items-center gap-3' : 'items-center justify-between'}`}
          >
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-sm font-semibold tracking-[0.25em] text-white">
                IS
              </div>

              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-indigo-200">Executive</p>
                  <p className="truncate text-sm font-semibold text-white">Inventory Suite</p>
                </div>
              )}
            </div>

            <button
              onClick={onToggleCollapse}
              className={`rounded-xl border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:bg-white/10 hover:text-white ${isCollapsed ? 'mt-1' : ''}`}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            <button
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:bg-white/10 hover:text-white md:hidden"
              title="Close sidebar"
            >
              <X size={16} />
            </button>
          </div>

          <nav className="space-y-2">
            <Link
              to="/dashboard"
              className={linkClass('/dashboard')}
              onClick={onClose}
              title="Dashboard"
            >
              <LayoutDashboard size={18} />
              {!isCollapsed && 'Dashboard'}
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                className={linkClass('/admin')}
                onClick={onClose}
                title="Admin Panel"
              >
                <ShieldCheck size={18} />
                {!isCollapsed && 'Admin Panel'}
              </Link>
            )}
            <Link to="/pos" className={linkClass('/pos')} onClick={onClose} title="Point of Sale">
              <Receipt size={18} />
              {!isCollapsed && 'Point of Sale'}
            </Link>
          </nav>

          {/* Admin sub-navigation */}
          {isAdmin && isAdminPage && !isCollapsed && (
            <div className="mt-4 space-y-1 border-t border-white/10 pt-4">
              <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-300">
                Admin Sections
              </p>
              {adminSubLinks.map((sub) => (
                <NavLink
                  key={sub.path}
                  to={sub.path}
                  className={adminSubLinkClass(sub.path)}
                  onClick={onClose}
                  title={sub.label}
                >
                  {sub.icon}
                  {!isCollapsed && sub.label}
                </NavLink>
              ))}
            </div>
          )}

          {!isAdminPage && (onAddItem || onBulkAddProducts || onChangePassword || onInviteUser || onSettings || onAddSupplier || onAddLocation || onAddPurchaseOrder) && (
            <div className="mt-6 space-y-2 border-t border-white/10 pt-4">
              {onAddItem && (
                <button onClick={onAddItem} className={actionClass} title="Add Product">
                  <Plus size={18} />
                  {!isCollapsed && 'Add Product'}
                </button>
              )}

              {onBulkAddProducts && (
                <button onClick={onBulkAddProducts} className={actionClass} title="Bulk Add Products">
                  <PackagePlus size={18} />
                  {!isCollapsed && 'Bulk Add Products'}
                </button>
              )}

              {onInviteUser && (
                <button onClick={onInviteUser} className={actionClass} title="Invite User">
                  <UserPlus size={18} />
                  {!isCollapsed && 'Invite User'}
                </button>
              )}

              {onSettings && (
                <button onClick={onSettings} className={actionClass} title="System Settings">
                  <Settings size={18} />
                  {!isCollapsed && 'System Settings'}
                </button>
              )}

              {onAddSupplier && (
                <button onClick={onAddSupplier} className={actionClass} title="Add Supplier">
                  <Truck size={18} />
                  {!isCollapsed && 'Add Supplier'}
                </button>
              )}

              {onAddLocation && (
                <button onClick={onAddLocation} className={actionClass} title="Add Location">
                  <MapPin size={18} />
                  {!isCollapsed && 'Add Location'}
                </button>
              )}

              {onAddPurchaseOrder && (
                <button onClick={onAddPurchaseOrder} className={actionClass} title="New Purchase Order">
                  <ClipboardList size={18} />
                  {!isCollapsed && 'New Purchase Order'}
                </button>
              )}

              {onChangePassword && (
                <button onClick={onChangePassword} className={actionClass} title="Change Password">
                  <KeyRound size={18} />
                  {!isCollapsed && 'Change Password'}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-white/10 p-4">
          <div
            className={`rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur ${
              isCollapsed ? 'flex justify-center' : ''
            }`}
          >
            {isCollapsed ? (
              <div className="flex flex-col items-center">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-200">
                  Live
                </span>
              </div>
            ) : (
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.25em] text-indigo-200">System state</p>
                <p className="mt-2 text-sm font-semibold text-white">All modules online</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  Secure access, live stock monitoring, and full audit visibility.
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}

