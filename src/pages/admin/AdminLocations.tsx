import { useState } from 'react'
import { Plus } from 'lucide-react'
import LocationsTable from '../../components/admin/LocationsTable'
import Modal from '../../components/ui/Modal'
import LocationForm from '../../components/admin/LocationForm'
import { Button } from '@/components/ui/button'

export default function AdminLocations() {
  const [showAddModal, setShowAddModal] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Locations & Branches</h3>
          <p className="mt-1 text-sm text-slate-500">Manage branches, distribution centers, and warehouses.</p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
        >
          <Plus size={16} />
          Add Location
        </Button>
      </div>

      <LocationsTable onAddClick={() => setShowAddModal(true)} />

      {showAddModal && (
        <Modal title="Add Location" onClose={() => setShowAddModal(false)}>
          <LocationForm onClose={() => setShowAddModal(false)} />
        </Modal>
      )}
    </div>
  )
}

