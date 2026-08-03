import ReturnsTable from '../../components/admin/ReturnsTable'

export default function AdminReturns() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Returns &amp; Replacements</h3>
        <p className="mt-1 text-sm text-slate-500">
          Log customer returns, damaged stock, supplier returns, and replacement orders.
        </p>
      </div>
      <ReturnsTable />
    </div>
  )
}

