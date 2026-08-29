import { Link } from 'react-router-dom'
import { ArrowDownLeft, ArrowUpRight, Clock } from 'lucide-react'
import type { StockMovement } from '../../hooks/useStockMovements'

interface RecentActivityFeedProps {
  movements: StockMovement[]
}

function timeAgo(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function RecentActivityFeed({ movements }: RecentActivityFeedProps) {
  const recent = movements.slice(0, 15)

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-sm font-semibold text-slate-900">Recent Stock Activity</h4>
          <Link
            to="/admin/movements"
            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            View all →
          </Link>
        </div>
        <p className="text-xs text-slate-500 mb-4">Latest inbound, sales, and movement audit events</p>

        {recent.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-center text-xs text-slate-500">
            <Clock size={24} className="text-slate-300 mb-2" />
            <p>No recent stock movements recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1">
            {recent.map((m) => {
              const isPositive = m.change_amount > 0
              return (
                <div key={m.id} className="flex items-start gap-3 text-xs p-1.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <div
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                      isPositive
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : 'bg-indigo-500/10 text-indigo-600'
                    }`}
                  >
                    {isPositive ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-semibold text-slate-900 truncate">{m.item_name}</p>
                      <span className={`shrink-0 font-bold ${isPositive ? 'text-emerald-600' : 'text-slate-700'}`}>
                        {isPositive ? `+${m.change_amount}` : m.change_amount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-0.5">
                      <span className="truncate">{m.user_email ? m.user_email.split('@')[0] : 'System'}</span>
                      <span className="shrink-0">{timeAgo(m.created_at)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>Auto-synced</span>
        <span className="font-medium text-slate-700">{movements.length} total entries</span>
      </div>
    </div>
  )
}
