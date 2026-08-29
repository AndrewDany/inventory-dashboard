import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
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
  LogOut,
} from 'lucide-react'
import { useProfile } from '../../hooks/useProfile'
import { useAuth } from '../../hooks/useAuth'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  isCollapsed: boolean
  onToggleCollapse: () => void
  onAddItem?: () => void
  onBulkAddProducts?: () => void
  onSellItem?: () => void
  onChangePassword?: () => void
  onInviteUser?: () => void
  onSettings?: () => void
  onAddSupplier?: () => void
  onAddLocation?: () => void
  onAddPurchaseOrder?: () => void
}

interface NavItem {
  path: string
  label: string
  icon: React.ReactNode
  adminOnly?: boolean
  badge?: string
  badgeVariant?: 'red' | 'indigo' | 'emerald'
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={17} /> },
      { path: '/pos', label: 'Point of Sale', icon: <Receipt size={17} /> },
      { path: '/admin/overview', label: 'Executive Overview', icon: <FileText size={17} />, adminOnly: true },
    ],
  },
  {
    title: 'Inventory & Operations',
    items: [
      { path: '/admin/locations', label: 'Locations', icon: <MapPin size={17} />, adminOnly: true },
      { path: '/admin/movements', label: 'Stock Movements', icon: <ArrowLeftRight size={17} />, adminOnly: true },
      { path: '/admin/batches', label: 'FIFO Batches', icon: <Layers size={17} />, adminOnly: true },
      { path: '/admin/adjustments', label: 'Adjustments', icon: <Scale size={17} />, adminOnly: true },
      { path: '/admin/low-stock', label: 'Low Stock Alerts', icon: <AlertTriangle size={17} />, adminOnly: true, badgeVariant: 'red' },
    ],
  },
  {
    title: 'Commerce & Orders',
    items: [
      { path: '/admin/orders', label: 'Purchase Orders', icon: <Package size={17} />, adminOnly: true },
      { path: '/admin/sales-orders', label: 'Sales Orders', icon: <ShoppingCart size={17} />, adminOnly: true },
      { path: '/admin/suppliers', label: 'Suppliers', icon: <Truck size={17} />, adminOnly: true },
      { path: '/admin/returns', label: 'Returns & Replacements', icon: <RotateCcw size={17} />, adminOnly: true },
    ],
  },
  {
    title: 'Finance & Governance',
    items: [
      { path: '/admin/financials', label: 'P&L Financials', icon: <DollarSign size={17} />, adminOnly: true },
      { path: '/admin/valuation', label: 'Valuation', icon: <Scale size={17} />, adminOnly: true },
      { path: '/admin/reports', label: 'Reports & Analytics', icon: <BarChart3 size={17} />, adminOnly: true },
      { path: '/admin/users', label: 'Users & Roles', icon: <Users size={17} />, adminOnly: true },
      { path: '/admin/audit-events', label: 'Audit Trail', icon: <SearchCheck size={17} />, adminOnly: true },
      { path: '/admin/activity', label: 'Activity Logs', icon: <Activity size={17} />, adminOnly: true },
    ],
  },
]

export default function Sidebar({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
  onAddItem,
  onBulkAddProducts,
  onSellItem,
  onChangePassword,
  onInviteUser,
  onSettings,
  onAddSupplier,
  onAddLocation,
  onAddPurchaseOrder,
}: SidebarProps) {
  const location = useLocation()
  const { data: profile } = useProfile()
  const { signOut, session } = useAuth()
  const isAdmin = profile?.role === 'admin'

  const userEmail = session?.user.email ?? profile?.email ?? 'User'
  const userName = userEmail.split('@')[0]
  const initials = userName.slice(0, 2).toUpperCase()

  const linkClass = (path: string) => {
    const active = location.pathname === path
    return `group flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
      active
        ? 'bg-slate-900 text-white font-semibold shadow-xs'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    } ${isCollapsed ? 'justify-center px-2' : ''}`
  }

  const actionBtnClass = `flex w-full items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs font-medium text-slate-700 transition-all hover:bg-slate-100 hover:text-slate-900 ${
    isCollapsed ? 'justify-center px-2' : ''
  }`

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen flex-col justify-between overflow-hidden border-r border-slate-200/80 bg-white text-slate-900 shadow-sm transition-all duration-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'w-20' : 'w-64'} md:sticky md:top-0 md:h-screen md:translate-x-0 md:shrink-0 ${
          isCollapsed ? 'md:w-20' : 'md:w-64'
        }`}
      >
        {/* Top Brand & Collapse Toggle */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 scrollbar-thin">
          <div
            className={`mb-5 flex items-center ${
              isCollapsed ? 'flex-col gap-2' : 'justify-between px-1'
            }`}
          >
            <Link to="/dashboard" className="flex items-center gap-2.5 min-w-0" onClick={onClose}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white shadow-xs">
                IS
              </div>

              {!isCollapsed && (
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-sm font-bold text-slate-900">Inventory Suite</p>
                  <p className="truncate text-[11px] text-slate-500 font-medium">Enterprise Portal</p>
                </div>
              )}
            </Link>

            <div className="flex items-center gap-1">
              <button
                onClick={onToggleCollapse}
                className="hidden md:flex rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
              </button>

              <button
                onClick={onClose}
                className="flex md:hidden rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                title="Close sidebar"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Categorized Navigation */}
          <nav className="space-y-4">
            {navSections.map((section) => {
              // Filter items based on role
              const visibleItems = section.items.filter((item) => !item.adminOnly || isAdmin)
              if (visibleItems.length === 0) return null

              return (
                <div key={section.title} className="space-y-1">
                  {!isCollapsed && (
                    <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {section.title}
                    </p>
                  )}
                  <div className="space-y-0.5">
                    {visibleItems.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={linkClass(item.path)}
                        onClick={onClose}
                        title={item.label}
                      >
                        <span className="shrink-0">{item.icon}</span>
                        {!isCollapsed && (
                          <span className="truncate flex-1">{item.label}</span>
                        )}
                        {!isCollapsed && item.badgeVariant === 'red' && (
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                        )}
                      </NavLink>
                    ))}
                  </div>
                </div>
              )
            })}
          </nav>

          {/* Quick Operations Button List */}
          {(onAddItem || onSellItem || onBulkAddProducts || onAddPurchaseOrder || onAddSupplier || onAddLocation || onInviteUser || onChangePassword || onSettings) && (
            <div className="mt-5 pt-4 border-t border-slate-100 space-y-1.5">
              {!isCollapsed && (
                <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Quick Actions
                </p>
              )}

              {onAddItem && (
                <button onClick={onAddItem} className={actionBtnClass} title="Add Product">
                  <Plus size={15} className="text-indigo-600" />
                  {!isCollapsed && <span>Add Product</span>}
                </button>
              )}

              {onSellItem && (
                <button onClick={onSellItem} className={actionBtnClass} title="Sell Item in POS">
                  <ShoppingCart size={15} className="text-emerald-600" />
                  {!isCollapsed && <span>Sell Item</span>}
                </button>
              )}

              {onBulkAddProducts && (
                <button onClick={onBulkAddProducts} className={actionBtnClass} title="Bulk Add">
                  <PackagePlus size={15} className="text-amber-600" />
                  {!isCollapsed && <span>Bulk Import</span>}
                </button>
              )}

              {onAddPurchaseOrder && (
                <button onClick={onAddPurchaseOrder} className={actionBtnClass} title="New Purchase Order">
                  <ClipboardList size={15} className="text-blue-600" />
                  {!isCollapsed && <span>New PO</span>}
                </button>
              )}

              {onAddSupplier && (
                <button onClick={onAddSupplier} className={actionBtnClass} title="Add Supplier">
                  <Truck size={15} className="text-purple-600" />
                  {!isCollapsed && <span>Add Supplier</span>}
                </button>
              )}

              {onAddLocation && (
                <button onClick={onAddLocation} className={actionBtnClass} title="Add Location">
                  <MapPin size={15} className="text-cyan-600" />
                  {!isCollapsed && <span>Add Location</span>}
                </button>
              )}

              {onInviteUser && (
                <button onClick={onInviteUser} className={actionBtnClass} title="Invite User">
                  <UserPlus size={15} className="text-slate-600" />
                  {!isCollapsed && <span>Invite User</span>}
                </button>
              )}

              {onChangePassword && (
                <button onClick={onChangePassword} className={actionBtnClass} title="Change Password">
                  <KeyRound size={15} className="text-slate-600" />
                  {!isCollapsed && <span>Change Password</span>}
                </button>
              )}

              {onSettings && (
                <button onClick={onSettings} className={actionBtnClass} title="Settings">
                  <Settings size={15} className="text-slate-600" />
                  {!isCollapsed && <span>Settings</span>}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bottom User Card */}
        <div className="p-3 border-t border-slate-200/80 bg-slate-50/50">
          <div className="flex items-center justify-between gap-2.5 rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">
                {initials}
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>

              {!isCollapsed && (
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-xs font-semibold text-slate-900 capitalize">{userName}</p>
                  <span className="inline-block rounded bg-slate-100 px-1 py-0.2 text-[9px] font-bold uppercase tracking-wider text-slate-600">
                    {profile?.role ?? 'Member'}
                  </span>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <button
                onClick={signOut}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-rose-600"
                title="Sign out"
              >
                <LogOut size={15} />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}


