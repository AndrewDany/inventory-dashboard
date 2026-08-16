import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'
import { useInventory, useDeleteInventoryItem } from '../hooks/useInventory'
import { useBudget } from '../hooks/useBudget'
import { useInventoryBatches } from '../hooks/useInventoryBatches'
import { useStockMovements } from '../hooks/useStockMovements'
import InventoryForm from '../components/inventory/InventoryForm'
import InventoryTable from '../components/inventory/InventoryTable'
import DeleteConfirmModal from '../components/inventory/DeleteConfirmModal'
import CSVImportModal from '../components/inventory/CSVImportModal'
import BarcodeLabelPrinter from '../components/inventory/BarcodeLabelPrinter'
import BulkProductModal from '../components/inventory/BulkProductModal'
import Modal from '../components/ui/Modal'
import StatsCards from '../components/dashboard/StatsCards'
import CategoryChart from '../components/dashboard/CategoryChart'
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton'
import ChangePasswordForm from '../components/settings/ChangePasswordForm'
import PageLayout from '../components/layout/PageLayout'
import type { InventoryItem } from '../types/inventory'
import ExportMenu from '../components/inventory/ExportMenu'
import UsagePanel from '../components/dashboard/UsagePanel'

export default function Dashboard() {
  const { data: profile } = useProfile()
  const { data: items, isLoading, error } = useInventory()
  const deleteItem = useDeleteInventoryItem()

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showLabelPrinter, setShowLabelPrinter] = useState(false)
  const [showBulkAddModal, setShowBulkAddModal] = useState(false)

  const isAdmin = profile?.role === 'admin'
  const isDemo = profile?.role === 'demo'
  const navigate = useNavigate()

  const { data: budgetSummary } = useBudget()
  const { data: batches = [] } = useInventoryBatches()
  const { data: movements = [] } = useStockMovements()

  const budget = budgetSummary?.monthlyBudget ?? 0
  const spent = budgetSummary?.spentThisMonth ?? 0

  async function handleDelete() {
    if (!deletingItem) return
    await deleteItem.mutateAsync({ id: deletingItem.id, name: deletingItem.name })
    setDeletingItem(null)
  }

  return (
    <PageLayout
      title="Inventory Dashboard"
      onAddItem={isDemo ? undefined : () => setShowAddModal(true)}
      onBulkAddProducts={isDemo ? undefined : () => setShowBulkAddModal(true)}
      onSellItem={isDemo ? undefined : () => navigate('/pos')}
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
          <div className="flex justify-end mb-4">
            <ExportMenu items={items} />
          </div>

          <UsagePanel />
          <StatsCards items={items} />
          <CategoryChart items={items} />
          <InventoryTable
            items={items}
            onEdit={(item) => setEditingItem(item)}
            onDelete={(item) => setDeletingItem(item)}
            isAdmin={isAdmin}
          />

          {/* Financial + recent batches/movements powered by store */}
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border bg-white p-4">
              <p className="text-xs uppercase text-slate-500">Budget</p>
              <div className="mt-2 text-xl font-semibold">${budget.toLocaleString()}</div>
              <p className="mt-1 text-sm text-slate-600">Spent: ${spent.toLocaleString()}</p>
              <p className="mt-1 text-sm text-slate-600">Remaining: ${(Math.max(budget - spent, 0)).toLocaleString()}</p>
            </div>

            <div className="rounded-2xl border bg-white p-4">
              <p className="text-sm font-semibold">Recent batches</p>
              <div className="mt-3 space-y-2">
                {batches.slice(0, 5).map((b) => (
                  <div key={b.id} className="flex justify-between">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{b.inventory_batches.sku}</div>
                      <div className="text-xs text-slate-500">{b.inventory_batches.batch_code} • {new Date(b.updated_at).toLocaleString()}</div>
                    </div>
                    <div className="font-semibold">{b.on_hand_quantity}</div>
                  </div>
                ))}
                {batches.length === 0 && <div className="text-sm text-slate-500">No batches yet</div>}
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-4">
              <p className="text-sm font-semibold">Recent movements</p>
              <div className="mt-3 space-y-2">
                {movements.slice(0, 5).map((m) => (
                  <div key={m.id} className="flex justify-between">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{m.item_name}</div>
                      <div className="text-xs text-slate-500">{new Date(m.created_at).toLocaleString()}</div>
                    </div>
                    <div className="font-semibold">{m.change_amount > 0 ? `+${m.change_amount}` : m.change_amount}</div>
                  </div>
                ))}
                {movements.length === 0 && <div className="text-sm text-slate-500">No movements yet</div>}
              </div>
            </div>
          </div>
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

      {showImportModal && (
        <Modal title="Import Items from CSV" onClose={() => setShowImportModal(false)}>
          <CSVImportModal onClose={() => setShowImportModal(false)} />
        </Modal>
      )}

      {showBulkAddModal && (
        <Modal title="Bulk Add Products" onClose={() => setShowBulkAddModal(false)}>
          <BulkProductModal onClose={() => setShowBulkAddModal(false)} />
        </Modal>
      )}

      {showLabelPrinter && (
        <Modal title="Print Barcode Labels" onClose={() => setShowLabelPrinter(false)}>
          <BarcodeLabelPrinter onClose={() => setShowLabelPrinter(false)} />
        </Modal>
      )}
    </PageLayout>
  )
}
