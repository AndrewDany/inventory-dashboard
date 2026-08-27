import { useState } from 'react'
import { useSuppliers, useDeleteSupplier } from '../../hooks/useSuppliers'
import Modal from '../ui/Modal'
import SupplierForm from './SupplierForm'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Supplier } from '../../types/supplier'

export default function SuppliersTable() {
  const { data: suppliers, isLoading, error } = useSuppliers()
  const deleteSupplier = useDeleteSupplier()
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  if (isLoading) return <p className="text-gray-500 text-sm">Loading suppliers...</p>
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowAddModal(true)} className="bg-indigo-600 hover:bg-indigo-700">
          Add Supplier
        </Button>
      </div>

      {(!suppliers || suppliers.length === 0) && (
        <p className="text-gray-500 text-sm">No suppliers yet — click "Add Supplier" above to create one.</p>
      )}

      {suppliers && suppliers.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.name}</TableCell>
                <TableCell className="text-gray-600">{s.contact_person || '—'}</TableCell>
                <TableCell className="text-gray-600">{s.phone || '—'}</TableCell>
                <TableCell className="text-gray-600">{s.email || '—'}</TableCell>
                <TableCell className="space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => setEditingSupplier(s)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => deleteSupplier.mutate(s.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {editingSupplier && (
        <Modal title="Edit Supplier" onClose={() => setEditingSupplier(null)}>
          <SupplierForm supplier={editingSupplier} onClose={() => setEditingSupplier(null)} />
        </Modal>
      )}

      {showAddModal && (
        <Modal title="Add Supplier" onClose={() => setShowAddModal(false)}>
          <SupplierForm onClose={() => setShowAddModal(false)} />
        </Modal>
      )}
    </div>
  )
}