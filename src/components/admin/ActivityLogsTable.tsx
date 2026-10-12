import { Activity, Plus, Pencil, Trash2, LogIn, LogOut } from 'lucide-react'
import { useActivityLogs } from '../../hooks/useActivityLogs'
import { formatTimestamp, relativeTime } from '../../lib/relativeTime'

const ACTION_META = {
  created: { icon: Plus, bg: 'bg-emerald-50', text: 'text-emerald-600' },
  updated: { icon: Pencil, bg: 'bg-indigo-50', text: 'text-indigo-600' },
  deleted: { icon: Trash2, bg: 'bg-rose-50', text: 'text-rose-600' },
  login: { icon: LogIn, bg: 'bg-blue-50', text: 'text-blue-600' },
  logout: { icon: LogOut, bg: 'bg-slate-50', text: 'text-slate-500' },
} as const

const DEFAULT_ACTION_META = { icon: Activity, bg: 'bg-slate-100', text: 'text-slate-600' }

export default function ActivityLogsTable() {
  const { data: logs, isLoading, error } = useActivityLogs()

  if (isLoading) return <p className="text-gray-500 text-sm">Loading activity...</p>
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>
  if (!logs || logs.length === 0) return <p className="text-gray-500 text-sm">No activity yet.</p>

  return (
    <div className="max-h-[480px] overflow-auto rounded-lg border border-slate-100 bg-white">
      <div className="min-w-[640px] divide-y divide-slate-100">
        {logs.map((log) => {
          const meta = ACTION_META[log.action as keyof typeof ACTION_META] ?? DEFAULT_ACTION_META
          const Icon = meta.icon
          return (
            <div key={log.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.bg} ${meta.text}`}>
                <Icon size={14} />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{log.item_name}</p>
                <p className="text-xs text-slate-500">
                  {log.user_email} &middot; <span className="capitalize">{log.action}</span>
                </p>
              </div>

              <span
                className="shrink-0 text-xs text-slate-400"
                title={formatTimestamp(log.created_at)}
              >
                {relativeTime(log.created_at)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}