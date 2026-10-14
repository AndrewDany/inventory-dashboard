import { useState } from 'react'
import { Activity, Plus, Pencil, Trash2, LogIn, LogOut } from 'lucide-react'
import { useActivityLogs } from '../../hooks/useActivityLogs'
import { relativeTime } from '../../lib/relativeTime'

const ACTION_META = {
  created: { icon: Plus, bg: 'bg-emerald-50 dark:bg-emerald-950/60', text: 'text-emerald-600 dark:text-emerald-400' },
  updated: { icon: Pencil, bg: 'bg-indigo-50 dark:bg-indigo-950/60', text: 'text-indigo-600 dark:text-indigo-400' },
  deleted: { icon: Trash2, bg: 'bg-rose-50 dark:bg-rose-950/60', text: 'text-rose-600 dark:text-rose-400' },
  login: { icon: LogIn, bg: 'bg-blue-50 dark:bg-blue-950/60', text: 'text-blue-600 dark:text-blue-400' },
  logout: { icon: LogOut, bg: 'bg-amber-50 dark:bg-amber-950/60', text: 'text-amber-600 dark:text-amber-400' },
} as const

const DEFAULT_ACTION_META = { icon: Activity, bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400' }

export default function ActivityLogsTable() {
  const { data: logs, isLoading, error } = useActivityLogs()
  const [filter, setFilter] = useState<'all' | 'sessions' | 'inventory'>('all')

  if (isLoading) return <p className="text-gray-500 text-sm py-4">Loading activity logs...</p>
  if (error) return <p className="text-red-600 text-sm py-4">Error: {error.message}</p>
  if (!logs || logs.length === 0) return <p className="text-gray-500 text-sm py-4">No activity yet.</p>

  const filteredLogs = logs.filter((log) => {
    if (filter === 'sessions') return log.action === 'login' || log.action === 'logout'
    if (filter === 'inventory') return log.action !== 'login' && log.action !== 'logout'
    return true
  })

  return (
    <div className="space-y-3">
      {/* Filter Tabs for quick inspection */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
            filter === 'all'
              ? 'bg-slate-900 dark:bg-indigo-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
          }`}
        >
          All Activity ({logs.length})
        </button>
        <button
          onClick={() => setFilter('sessions')}
          className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
            filter === 'sessions'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
          }`}
        >
          <LogIn size={13} />
          Staff Logins & Logouts ({logs.filter((l) => l.action === 'login' || l.action === 'logout').length})
        </button>
        <button
          onClick={() => setFilter('inventory')}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
            filter === 'inventory'
              ? 'bg-slate-900 dark:bg-indigo-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
          }`}
        >
          Operations & Inventory
        </button>
      </div>

      <div className="max-h-[520px] overflow-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredLogs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No logs found in this category.</div>
          ) : (
            filteredLogs.map((log) => {
              const meta = ACTION_META[log.action as keyof typeof ACTION_META] ?? DEFAULT_ACTION_META
              const Icon = meta.icon
              const isSession = log.action === 'login' || log.action === 'logout'
              const formattedDate = new Date(log.created_at).toLocaleString()

              return (
                <div key={log.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200/50 dark:border-slate-700 ${meta.bg} ${meta.text}`}>
                    <Icon size={15} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{log.item_name || 'System Action'}</p>
                      {isSession && (
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
                          log.action === 'login' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {log.action}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {log.user_email} &middot; <span className="capitalize">{log.action}</span>
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                      {relativeTime(log.created_at)}
                    </span>
                    <span className="block text-[10px] text-slate-400 dark:text-slate-500" title={formattedDate}>
                      {formattedDate}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}