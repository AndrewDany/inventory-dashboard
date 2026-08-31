import { getStatusClasses } from '@/lib/statusStyles'
import { cn } from '@/lib/utils'

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
      {status}
    </span>
  )
}