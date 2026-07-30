import StockMovementsTable from '../../components/admin/StockMovementsTable'

export default function AdminMovements() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Stock Movements</h3>
        <p className="mt-1 text-sm text-slate-500">Track inventory changes and maintain operational visibility.</p>
      </div>
      <StockMovementsTable />
    </div>
  )
}

