import { useState } from 'react'
import { Bell } from 'lucide-react'
import { useNotifications } from '../../hooks/useNotifications'

export default function NotificationCenter() {
  const { data: notifications, isLoading } = useNotifications()
  const [open, setOpen] = useState(false)

  const unread = notifications?.filter((n) => !n.read).length ?? 0

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
        title="Notifications"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-80 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900">Notifications</p>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {isLoading && (
                <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
              )}

              {!isLoading && (!notifications || notifications.length === 0) && (
                <div className="p-4 text-center text-sm text-gray-500">No notifications yet</div>
              )}

              {notifications?.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 ${
                    !n.read ? 'bg-indigo-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {n.action === 'created' && 'Item Created'}
                        {n.action === 'updated' && 'Item Updated'}
                        {n.action === 'deleted' && 'Item Deleted'}
                        {n.action === 'received' && 'Purchase Order Received'}
                        {n.action === 'shipped' && 'Sales Order Shipped'}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {n.action === 'created' && `Added: ${n.item_name}`}
                        {n.action === 'updated' && `Modified: ${n.item_name}`}
                        {n.action === 'deleted' && `Removed: ${n.item_name}`}
                        {n.action === 'received' && `PO: ${n.item_name}`}
                        {n.action === 'shipped' && `SO: ${n.item_name}`}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        by {n.user_email} • {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1 shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-center">
              <p className="text-[10px] text-gray-400">
                {notifications?.length ?? 0} events tracked
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}