import { useState } from 'react'
import { useProfile } from '../hooks/useProfile'
import { useInventory, useDeleteInventoryItem } from '../hooks/useInventory'
import InventoryForm from '../components/inventory/InventoryForm'
import InventoryTable from '../components/inventory/InventoryTable'
import DeleteConfirmModal from '../components/inventory/DeleteConfirmModal'
import Modal from '../components/ui/Modal'
import StatsCards from '../components/dashboard/StatsCards'
import CategoryChart from '../components/dashboard/CategoryChart'
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton'
import ChangePasswordForm from '../components/settings/ChangePasswordForm'
import PageLayout from '../components/layout/PageLayout'
import type { InventoryItem } from '../types/inventory'

export default function Dashboard() {
  const { data: profile } = useProfile()
  const { data: items, isLoading, error } = useInventory()
  const deleteItem = useDeleteInventoryItem()

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null)
  const [showPasswordForm, setShowPasswordForm] = useState(false)

  const isAdmin = profile?.role === 'admin'
  const isDemo = profile?.role === 'demo'

  async function handleDelete() {
    if (!deletingItem) return
    await deleteItem.mutateAsync({ id: deletingItem.id, name: deletingItem.name })
    setDeletingItem(null)
  }

  return (
    <PageLayout
      title="Inventory Dashboard"
      onAddItem={isDemo ? undefined : () => setShowAddModal(true)}
      onChangePassword={isDemo ? undefined : () => setShowPasswordForm(true)}
    >
      {isDemo && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg p-3 mb-6">
          You're viewing a read-only demo account. Changes are disabled.
        </div>
      )}

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
            isAdmin={isAdmin}
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

      {showPasswordForm && (
        <Modal title="Change Password" onClose={() => setShowPasswordForm(false)}>
          <ChangePasswordForm />
        </Modal>
      )}
    </PageLayout>
  )
}