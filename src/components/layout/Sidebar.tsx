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
}: {
  isOpen: boolean
  onClose: () => void
  isCollapsed: boolean
  onToggleCollapse: () => void
  onAddItem?: () => void
  onChangePassword?: () => void
  onInviteUser?: () => void
  onSettings?: () => void
}) {
  const location = useLocation()
  const { data: profile } = useProfile()
  const isAdmin = profile?.role === 'admin'

  const linkClass = (path: string) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      location.pathname === path
        ? 'bg-blue-50 text-blue-700'
        : 'text-gray-600 hover:bg-gray-100'
    } ${isCollapsed ? 'md:justify-center md:px-0' : ''}`

  const actionClass = `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors w-full ${
    isCollapsed ? 'md:justify-center md:px-0' : ''
  }`

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed md:static top-0 left-0 z-50 flex flex-col justify-between shrink-0 bg-white border-r border-gray-200 min-h-screen p-4 transition-all duration-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'md:w-20' : 'w-64'}`}
      >
        <div>
          <div className="flex items-center justify-between mb-8 px-2">
            {!isCollapsed && <h2 className="text-lg font-bold text-gray-900">Inventory</h2>}

            <button onClick={onClose} className="md:hidden text-gray-500">
              <X size={20} />
            </button>

            <button
              onClick={onToggleCollapse}
              className="hidden md:flex text-gray-400 hover:text-gray-600"
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>

          <nav className="space-y-1">
            <Link to="/" className={linkClass('/')} onClick={onClose} title="Dashboard">
              <LayoutDashboard size={18} />
              {!isCollapsed && 'Dashboard'}
            </Link>

            {isAdmin && (
              <Link to="/admin" className={linkClass('/admin')} onClick={onClose} title="Admin Panel">
                <ShieldCheck size={18} />
                {!isCollapsed && 'Admin Panel'}
              </Link>
            )}
          </nav>
        </div>

        {/* Bottom action buttons */}
        {(onAddItem || onChangePassword || onInviteUser || onSettings) && (
          <div className="space-y-1 border-t border-gray-200 pt-4">
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
            {onChangePassword && (
              <button onClick={onChangePassword} className={actionClass} title="Change Password">
                <KeyRound size={18} />
                {!isCollapsed && 'Change Password'}
              </button>
            )}
          </div>
        )}
      </aside>
    </>
  )
}