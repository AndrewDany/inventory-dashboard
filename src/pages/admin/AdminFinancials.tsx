import ProfitLossPanel from '../../components/admin/ProfitLossPanel'
import ExpensesTable from '../../components/admin/ExpensesTable'

export default function AdminFinancials() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Profit &amp; Loss</h3>
        <p className="mt-1 text-sm text-slate-500">Real margins from actual sales, cost of goods sold, and operating expenses.</p>
      </div>
      <ProfitLossPanel />
      <div className="mt-6 border-t border-slate-100 pt-6">
        <p className="text-sm font-semibold text-slate-900 mb-3">Expenses</p>
        <ExpensesTable />
      </div>
    </div>
  )
}

