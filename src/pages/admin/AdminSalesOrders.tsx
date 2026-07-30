import SalesOrdersTable from '../../components/admin/SalesOrdersTable'

export default function AdminSalesOrders() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Sales Orders</h3>
        <p className="mt-1 text-sm text-slate-500">Review fulfillment activity and ship orders.</p>
      </div>
      <SalesOrdersTable />
    </div>
  )
}

