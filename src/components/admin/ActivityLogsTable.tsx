import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useActivityLogs } from '../../hooks/useActivityLogs'
import { relativeTime } from '../../lib/relativeTime'

const ACTION_META = {
  created: { icon: Plus, bg: 'bg-emerald-50', text: 'text-emerald-600' },
  updated: { icon: Pencil, bg: 'bg-indigo-50', text: 'text-indigo-600' },
  deleted: { icon: Trash2, bg: 'bg-rose-50', text: 'text-rose-600' },
} as const

export default function ActivityLogsTable() {
  const { data: logs, isLoading, error } = useActivityLogs()

  if (isLoading) return <p className="text-gray-500 text-sm">Loading activity...</p>
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>
  if (!logs || logs.length === 0) return <p className="text-gray-500 text-sm">No activity yet.</p>

  return (
    <div className="divide-y divide-slate-100 rounded-lg border border-slate-100 bg-white">
      {logs.map((log) => {
        const meta = ACTION_META[log.action]
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
              title={new Date(log.created_at).toLocaleString()}
            >
              {relativeTime(log.created_at)}
            </span>
          </div>
        )
      })}
    </div>
  )
}