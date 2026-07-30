import ValuationPanel from '../../components/admin/ValuationPanel'

export default function AdminValuation() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Inventory Valuation</h3>
        <p className="mt-1 text-sm text-slate-500">Recompute inventory value and view historical runs.</p>
      </div>
      <ValuationPanel />
    </div>
  )
}

