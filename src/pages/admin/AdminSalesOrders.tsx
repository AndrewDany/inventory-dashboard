import { useState } from 'react'
import SalesOrdersTable from '../../components/admin/SalesOrdersTable'
import SalesOrderForm from '../../components/admin/SalesOrderForm'
import Modal from '../../components/ui/Modal'
import { Button } from '@/components/ui/button'

export default function AdminSalesOrders() {
  const [showSOModal, setShowSOModal] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Sales Orders</h3>
          <p className="mt-1 text-sm text-slate-500">Review fulfillment activity and ship orders.</p>
        </div>
        <Button onClick={() => setShowSOModal(true)} className="bg-indigo-600 hover:bg-indigo-700">
          New Sales Order
        </Button>
      </div>
      <SalesOrdersTable />

      {showSOModal && (
        <Modal title="New Sales Order" onClose={() => setShowSOModal(false)}>
          <SalesOrderForm onClose={() => setShowSOModal(false)} />
        </Modal>
      )}
    </div>
  )
}