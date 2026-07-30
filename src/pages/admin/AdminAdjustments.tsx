import AdjustmentsTable from '../../components/admin/AdjustmentsTable'

export default function AdminAdjustments() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Inventory Adjustments</h3>
        <p className="mt-1 text-sm text-slate-500">Apply stock corrections and review adjustment history.</p>
      </div>
      <AdjustmentsTable />
    </div>
  )
}

