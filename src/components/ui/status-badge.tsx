import { getStatusClasses } from '@/lib/statusStyles'
import { cn } from '@/lib/utils'

// Display-only label overrides -- the underlying status value (used for
// color-coding via getStatusClasses and for all backend/business logic)
// stays exactly as stored; only what's shown to the user changes here.
const STATUS_LABELS: Record<string, string> = {
  shipped: 'Order Completed',
}

/**
 * Drop-in status badge that pulls its color from the shared statusStyles
 * map, so "cancelled" is always red, "shipped"/"completed" always green,
 * etc. — no matter which table renders it (sales orders, purchase
 * orders, returns, adjustments...).
 */
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        getStatusClasses(status),
        className
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}