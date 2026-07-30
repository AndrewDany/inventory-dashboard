import SuppliersTable from '../../components/admin/SuppliersTable'

export default function AdminSuppliers() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Suppliers</h3>
        <p className="mt-1 text-sm text-slate-500">Organize supplier details and purchasing relationships.</p>
      </div>
      <SuppliersTable />
    </div>
  )
}

