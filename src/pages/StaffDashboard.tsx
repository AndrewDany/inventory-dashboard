import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Package,
  AlertTriangle,
  Layers,
  ShoppingCart,
  ArrowRight,
  Boxes,
  CheckCircle2,
} from 'lucide-react'
import { useProfile } from '../hooks/useProfile'
import { useInventory } from '../hooks/useInventory'
import { useStockMovements } from '../hooks/useStockMovements'
import InventoryTable from '../components/inventory/InventoryTable'
import RecentActivityFeed from '../components/dashboard/RecentActivityFeed'
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton'
import ChangePasswordForm from '../components/settings/ChangePasswordForm'
import PageLayout from '../components/layout/PageLayout'
import Modal from '../components/ui/Modal'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'

export default function StaffDashboard() {
  const { t } = useLanguage()
  const { data: profile } = useProfile()
  const { data: items, isLoading, error } = useInventory()
  const { data: movements = [] } = useStockMovements()
  const navigate = useNavigate()

  const [showPasswordForm, setShowPasswordForm] = useState(false)

  const userName = profile?.email ? profile.email.split('@')[0] : 'Staff'

  const stats = useMemo(() => {
    if (!items) {
      return { totalProducts: 0, totalUnits: 0, lowStockCount: 0, outOfStockCount: 0, categoriesCount: 0 }
    }
    const totalProducts = items.length
    const totalUnits = items.reduce((sum, item) => sum + (item.quantity ?? 0), 0)
    const lowStockItems = items.filter((item) => item.quantity <= item.reorder_level && item.quantity > 0)
    const outOfStockItems = items.filter((item) => item.quantity <= 0)
    const categoriesCount = new Set(items.map((i) => i.category || 'General')).size

    return {
      totalProducts,
      totalUnits,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      categoriesCount,
    }
  }, [items])

  return (
    <PageLayout
      title="Staff Dashboard"
      onSellItem={() => navigate('/pos')}
      onChangePassword={() => setShowPasswordForm(true)}
    >
      {/* Staff Welcome Banner */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-linear-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 text-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-300 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Staff Portal Active
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Welcome back, <span className="capitalize">{userName}</span>
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Ready for service. Access the Point of Sale system to stage and complete sales, or check stock availability below.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              onClick={() => navigate('/pos')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-xs flex items-center gap-2 px-5 py-2.5 h-auto rounded-xl text-sm transition"
            >
              <ShoppingCart size={17} />
              Open Point of Sale
              <ArrowRight size={15} />
            </Button>
          </div>
        </div>
      </div>

      {isLoading && <DashboardSkeleton />}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">
          Something went wrong loading inventory: {error.message}
        </div>
      )}

      {items && (
        <>
          {/* Staff Operational Metric Cards (No Financial / Margin Data) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* 1. Total Products in Catalog */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Products
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
                  <Package size={18} />
                </div>
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-slate-900">
                  {stats.totalProducts.toLocaleString()}
                </span>
                <span className="text-xs font-medium text-slate-500">SKUs registered</span>
              </div>

              <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                <span>{stats.categoriesCount} categories</span>
                <span className="font-medium text-indigo-600">Available</span>
              </div>

              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-indigo-500 w-full" />
              </div>
            </div>

            {/* 2. Total Units in Stock */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Units On Hand
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Boxes size={18} />
                </div>
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-slate-900">
                  {stats.totalUnits.toLocaleString()}
                </span>
                <span className="text-xs font-medium text-slate-500">units in stock</span>
              </div>

              <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                  <CheckCircle2 size={13} /> Ready for checkout
                </span>
                <span>Active</span>
              </div>

              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-500 w-4/5" />
              </div>
            </div>

            {/* 3. Low Stock Items */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Low Stock Attention
                </span>
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    stats.lowStockCount > 0 ? 'bg-amber-500/10 text-amber-600' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <AlertTriangle size={18} />
                </div>
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <span
                  className={`text-2xl font-bold tracking-tight ${
                    stats.lowStockCount > 0 ? 'text-amber-600' : 'text-slate-900'
                  }`}
                >
                  {stats.lowStockCount}
                </span>
                <span className="text-xs font-medium text-slate-500">items near reorder</span>
              </div>

              <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                <span>Threshold reached</span>
                <span className="font-medium text-amber-600">Alert</span>
              </div>

              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${
                    stats.lowStockCount > 0 ? 'bg-amber-500 w-1/2' : 'bg-emerald-500 w-full'
                  }`}
                />
              </div>
            </div>

            {/* 4. Out of Stock Notice */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Out of Stock
                </span>
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    stats.outOfStockCount > 0 ? 'bg-rose-500/10 text-rose-600' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Layers size={18} />
                </div>
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <span
                  className={`text-2xl font-bold tracking-tight ${
                    stats.outOfStockCount > 0 ? 'text-rose-600' : 'text-slate-900'
                  }`}
                >
                  {stats.outOfStockCount}
                </span>
                <span className="text-xs font-medium text-slate-500">SKUs zero stock</span>
              </div>

              <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                <span>Inform manager</span>
                <span className="font-medium text-rose-600">Zero unit</span>
              </div>

              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${
                    stats.outOfStockCount > 0 ? 'bg-rose-500 w-1/3' : 'bg-emerald-500 w-full'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Product Catalog Lookup & Activity Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {t('Product Catalog & Availability')}
                </span>
                <span className="text-xs text-slate-400">Read-only view</span>
              </div>

              {/* Read-only table for staff: isAdmin = false, empty handlers */}
              <InventoryTable
                items={items}
                onEdit={() => {}}
                onDelete={() => {}}
                isAdmin={false}
              />
            </div>

            <div className="lg:col-span-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {t('Live Activity')}
                </span>
              </div>

              <RecentActivityFeed movements={movements} hideViewAll={true} />
            </div>
          </div>
        </>
      )}

      {showPasswordForm && (
        <Modal title="Change Password" onClose={() => setShowPasswordForm(false)}>
          <ChangePasswordForm />
        </Modal>
      )}
    </PageLayout>
  )
}
