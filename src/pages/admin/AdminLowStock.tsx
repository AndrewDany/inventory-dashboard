import LowStockTracker from '../../components/admin/LowStockTracker'

export default function AdminLowStock() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Low Stock Tracker</h3>
        <p className="mt-1 text-sm text-slate-500">Stay ahead of shortages with a focused inventory view.</p>
      </div>
      <LowStockTracker />
    </div>
  )
}

