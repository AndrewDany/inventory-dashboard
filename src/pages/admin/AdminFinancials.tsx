import FinancialOverviewPanel from '../../components/admin/FinancialOverviewPanel'

export default function AdminFinancials() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Profit &amp; Loss</h3>
        <p className="mt-1 text-sm text-slate-500">Real margins from actual sales, cost of goods sold, and operating expenses.</p>
      </div>
      <FinancialOverviewPanel />
    </div>
  )
}

