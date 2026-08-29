import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'
import { useInventory, useDeleteInventoryItem } from '../hooks/useInventory'
import { useStockMovements } from '../hooks/useStockMovements'
import { useMonthlyFinancials } from '../hooks/useMonthlyFinancials'
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
import CategoryDonut from '../components/dashboard/CategoryDonut'
import RecentActivityFeed from '../components/dashboard/RecentActivityFeed'
import UsagePanel from '../components/dashboard/UsagePanel'

export default function Dashboard() {
  const { data: profile } = useProfile()
  const { data: items, isLoading, error } = useInventory()
  const { data: monthlyFinancials } = useMonthlyFinancials()
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

  const { data: movements = [] } = useStockMovements()

  const lastMonthSales = monthlyFinancials && monthlyFinancials.length > 0
    ? monthlyFinancials[monthlyFinancials.length - 1].grossSales
    : undefined

  const userName = profile?.email ? profile.email.split('@')[0] : 'Admin'

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
      {/* Zenith Welcome Banner */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h2>
        <p className="text-sm text-slate-500 mt-1">
          Welcome back, <span className="font-semibold text-slate-700 capitalize">{userName}</span>. Here&apos;s what&apos;s happening with your inventory today.
        </p>
      </div>

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
          {/* Top 4 KPI Cards */}
          <StatsCards items={items} monthlyRevenue={lastMonthSales} />

          {/* Zenith Middle Grid (70/30 split) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
            <div className="lg:col-span-8">
              <CategoryChart items={items} monthlyFinancials={monthlyFinancials} />
            </div>
            <div className="lg:col-span-4 flex flex-col gap-6">
              <CategoryDonut items={items} />
              <UsagePanel items={items} />
            </div>
          </div>

          {/* Zenith Bottom Grid (70/30 split: Main Table + Recent Activity) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Product Management
                </span>
                <ExportMenu items={items} />
              </div>

              <InventoryTable
                items={items}
                onEdit={(item) => setEditingItem(item)}
                onDelete={(item) => setDeletingItem(item)}
                isAdmin={isAdmin}
              />
            </div>

            <div className="lg:col-span-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Live Audit Feed
                </span>
              </div>

              <RecentActivityFeed movements={movements} />
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
