import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ShieldCheck,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  KeyRound,
  UserPlus,
  Settings,
  Truck,
  MapPin,
  ClipboardList,
} from 'lucide-react'
import { useProfile } from '../../hooks/useProfile'

export default function Sidebar({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
  onAddItem,
  onChangePassword,
  onInviteUser,
  onSettings,
  onAddSupplier,
  onAddLocation,
  onAddPurchaseOrder,
}: {
  isOpen: boolean
  onClose: () => void
  isCollapsed: boolean
  onToggleCollapse: () => void
  onAddItem?: () => void
  onChangePassword?: () => void
  onInviteUser?: () => void
  onSettings?: () => void
  onAddSupplier?: () => void
  onAddLocation?: () => void
  onAddPurchaseOrder?: () => void
}) {
  const location = useLocation()
  const { data: profile } = useProfile()
  const isAdmin = profile?.role === 'admin'

  const linkClass = (path: string) => {
    const active = location.pathname === path
    return `group flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-sm font-medium transition-all ${
      active
        ? 'border-white/15 bg-white/15 text-white shadow-[0_10px_25px_rgba(15,23,42,0.18)]'
        : 'border-transparent text-slate-200 hover:border-white/10 hover:bg-white/10 hover:text-white'
    } ${isCollapsed ? 'justify-center px-3' : ''}`
  }

  const actionClass = `flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-white/15 ${isCollapsed ? 'justify-center px-3' : ''}`

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
          </nav>

          {(onAddItem || onChangePassword || onInviteUser || onSettings || onAddSupplier || onAddLocation || onAddPurchaseOrder) && (
            <div className="mt-6 space-y-2 border-t border-white/10 pt-4">
              {onAddItem && (
                <button onClick={onAddItem} className={actionClass} title="Add Item">
                  <Plus size={18} />
                  {!isCollapsed && 'Add Item'}
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