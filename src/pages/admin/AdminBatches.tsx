import InventoryBatchesTable from '../../components/admin/InventoryBatchesTable'

export default function AdminBatches() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Inventory Batches</h3>
        <p className="mt-1 text-sm text-slate-500">View stock by batch/lot for traceability.</p>
      </div>
      <InventoryBatchesTable />
    </div>
  )
}

