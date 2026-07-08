import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useInventory, useDeleteInventoryItem } from '../hooks/useInventory'
import InventoryForm from '../components/inventory/InventoryForm'
import InventoryTable from '../components/inventory/InventoryTable'
import DeleteConfirmModal from '../components/inventory/DeleteConfirmModal'
import Modal from '../components/ui/Modal'
import StatsCards from '../components/dashboard/StatsCards'
import CategoryChart from '../components/dashboard/CategoryChart'
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton'
import type { InventoryItem } from '../types/inventory'

export default function Dashboard() {
  const { session, signOut } = useAuth()
  const { data: items, isLoading, error } = useInventory()
  const deleteItem = useDeleteInventoryItem()

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleDelete() {
    if (!deletingItem) return
    await deleteItem.mutateAsync(deletingItem.id)
    setDeletingItem(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header bar */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-8 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Inventory Dashboard</h1>

          {/* Desktop actions */}
          <div className="hidden sm:flex items-center gap-4">
            <p className="text-gray-600 text-sm">Logged in as: {session?.user.email}</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
            >
              + Add Item
            </button>
            <button
              onClick={signOut}
              className="text-sm text-red-600 hover:underline"
            >
              Sign out
            </button>
          </div>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="sm:hidden p-2 text-gray-700"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="sm:hidden bg-white rounded-lg shadow p-4 mt-4 space-y-3">
            <p className="text-gray-600 text-sm border-b pb-3">
              Logged in as: {session?.user.email}
            </p>
            <button
              onClick={() => {
                setShowAddModal(true)
                setMenuOpen(false)
              }}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm text-left"
            >
              + Add Item
            </button>
            <button
              onClick={signOut}
              className="w-full text-sm text-red-600 hover:underline text-left"
            >
              Sign out
            </button>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-8">
        {isLoading && <DashboardSkeleton />}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            Something went wrong loading your inventory: {error.message}
          </div>
        )}

        {items && items.length === 0 && (
          <p className="text-gray-500">No items yet — add your first one.</p>
        )}

        {items && items.length > 0 && (
          <>
            <StatsCards items={items} />
            <CategoryChart items={items} />
            <InventoryTable
              items={items}
              onEdit={(item) => setEditingItem(item)}
              onDelete={(item) => setDeletingItem(item)}
            />
          </>
        )}

        {showAddModal && (
          <Modal title="Add Inventory Item" onClose={() => setShowAddModal(false)}>
            <InventoryForm onClose={() => setShowAddModal(false)} />
          </Modal>
        )}

        {editingItem && (
          <Modal title="Edit Inventory Item" onClose={() => setEditingItem(null)}>
            <InventoryForm item={editingItem} onClose={() => setEditingItem(null)} />
          </Modal>
        )}

        {deletingItem && (
          <Modal title="Delete Item" onClose={() => setDeletingItem(null)}>
            <DeleteConfirmModal
              itemName={deletingItem.name}
              onConfirm={handleDelete}
              onCancel={() => setDeletingItem(null)}
              isDeleting={deleteItem.isPending}
            />
          </Modal>
        )}
      </div>
    </div>
  )
}