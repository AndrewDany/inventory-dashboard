import { useState } from 'react'
import PurchaseOrdersTable from '../../components/admin/PurchaseOrdersTable'
import PurchaseOrderForm from '../../components/admin/PurchaseOrderForm'
import Modal from '../../components/ui/Modal'
import { Button } from '@/components/ui/button'

export default function AdminOrders() {
  const [showPOModal, setShowPOModal] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Purchase Orders</h3>
          <p className="mt-1 text-sm text-slate-500">Review procurement activity and supplier commitments.</p>
        </div>
        <Button onClick={() => setShowPOModal(true)} className="bg-indigo-600 hover:bg-indigo-700">
          New Purchase Order
        </Button>
      </div>
      <PurchaseOrdersTable />

      {showPOModal && (
        <Modal title="New Purchase Order" onClose={() => setShowPOModal(false)}>
          <PurchaseOrderForm onClose={() => setShowPOModal(false)} />
        </Modal>
      )}
    </div>
  )
}

