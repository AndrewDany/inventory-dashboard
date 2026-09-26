import { useState } from 'react'
import { Bell, AlertTriangle, AlertOctagon, CheckCircle2, Info, CheckCheck } from 'lucide-react'
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '../../hooks/useNotifications'
import { relativeTime } from '../../lib/relativeTime'

export default function NotificationCenter() {
  const { data: notifications, isLoading } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()
  const [open, setOpen] = useState(false)

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-rose-600 text-white text-[10px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-84 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-700">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                  className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-50 transition-colors"
                >
                  <CheckCheck size={14} />
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
              {isLoading && (
                <div className="py-8 text-center text-xs text-slate-400">Loading alerts...</div>
              )}

              {!isLoading && (!notifications || notifications.length === 0) && (
                <div className="py-12 px-4 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-2">
                    <Bell size={20} />
                  </div>
                  <p className="text-sm font-medium text-slate-700">All caught up!</p>
                  <p className="text-xs text-slate-400 mt-0.5">No notifications or stock warnings right now.</p>
                </div>
              )}

              {notifications?.map((n) => {
                const isDanger = n.type === 'danger' || n.title.toLowerCase().includes('out of stock')
                const isWarning = n.type === 'warning' || n.title.toLowerCase().includes('low stock')
                const isSuccess = n.type === 'success'

                let IconComponent = Info
                let iconColor = 'text-blue-600 bg-blue-50 border-blue-100'
                if (isDanger) {
                  IconComponent = AlertOctagon
                  iconColor = 'text-rose-600 bg-rose-50 border-rose-100'
                } else if (isWarning) {
                  IconComponent = AlertTriangle
                  iconColor = 'text-amber-600 bg-amber-50 border-amber-100'
                } else if (isSuccess) {
                  IconComponent = CheckCircle2
                  iconColor = 'text-emerald-600 bg-emerald-50 border-emerald-100'
                }

                return (
                  <div
                    key={n.id}
                    onClick={() => !n.read && markRead.mutate(n.id)}
                    className={`px-4 py-3 transition-colors flex items-start gap-3 cursor-pointer ${
                      !n.read ? 'bg-indigo-50/40 hover:bg-indigo-50/70' : 'hover:bg-slate-50/80 bg-white'
                    }`}
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${iconColor}`}>
                      <IconComponent size={16} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs font-semibold truncate ${!n.read ? 'text-slate-900' : 'text-slate-700'}`}>
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-600" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed line-clamp-2">
                        {n.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                        <span>{relativeTime(n.created_at)}</span>
                        <span>&middot;</span>
                        <span className="truncate max-w-[140px]">{n.user_email || 'System'}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/80 text-center text-[10px] text-slate-400 font-medium">
              Live Stock & System Alerts
            </div>
          </div>
        </>
      )}
    </div>
  )
}