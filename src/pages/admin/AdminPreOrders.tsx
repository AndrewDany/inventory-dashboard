import { useState } from 'react'
import PreOrdersTable from '../../components/admin/PreOrdersTable'
import PreOrderForm from '../../components/admin/PreOrderForm'
import Modal from '../../components/ui/Modal'
import { Button } from '@/components/ui/button'

export default function AdminPreOrders() {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Pre-Orders</h3>
          <p className="mt-1 text-sm text-slate-500">
            Orders taken by phone before the client arrives — payment collected on pickup or delivery.
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-amber-600 hover:bg-amber-700">
          New Pre-Order
        </Button>
      </div>
      <PreOrdersTable />

      {showModal && (
        <Modal title="New Pre-Order" onClose={() => setShowModal(false)}>
          <PreOrderForm onClose={() => setShowModal(false)} />
        </Modal>
      )}
    </div>
  )
}
