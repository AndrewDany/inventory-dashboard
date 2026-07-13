import { useState } from 'react'
import { useSuppliers, useDeleteSupplier } from '../../hooks/useSuppliers'
import Modal from '../ui/Modal'
import SupplierForm from './SupplierForm'
import type { Supplier } from '../../types/supplier'

export default function SuppliersTable() {
  const { data: suppliers, isLoading, error } = useSuppliers()
  const deleteSupplier = useDeleteSupplier()
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)

  if (isLoading) return <p className="text-gray-500 text-sm">Loading suppliers...</p>
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>

  return (
    <div>
      {(!suppliers || suppliers.length === 0) && (
        <p className="text-gray-500 text-sm">No suppliers yet — add your first one from the sidebar.</p>
      )}

      {suppliers && suppliers.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="p-3">Name</th>
                <th className="p-3">Contact Person</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Email</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id} className="border-b">
                  <td className="p-3">{s.name}</td>
                  <td className="p-3 text-gray-600">{s.contact_person || '—'}</td>
                  <td className="p-3 text-gray-600">{s.phone || '—'}</td>
                  <td className="p-3 text-gray-600">{s.email || '—'}</td>
                  <td className="p-3 space-x-3">
                    <button
                      onClick={() => setEditingSupplier(s)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteSupplier.mutate(s.id)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingSupplier && (
        <Modal title="Edit Supplier" onClose={() => setEditingSupplier(null)}>
          <SupplierForm supplier={editingSupplier} onClose={() => setEditingSupplier(null)} />
        </Modal>
      )}
    </div>
  )
}