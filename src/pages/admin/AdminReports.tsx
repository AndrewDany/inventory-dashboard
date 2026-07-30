import AdvancedReportsPanel from '../../components/admin/AdvancedReportsPanel'

export default function AdminReports() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Advanced Reports</h3>
        <p className="mt-1 text-sm text-slate-500">Valuation trends, top movers, and supplier performance analytics.</p>
      </div>
      <AdvancedReportsPanel />
    </div>
  )
}

