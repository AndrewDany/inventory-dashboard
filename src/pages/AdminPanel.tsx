import { useState, type FormEvent, type ReactNode } from 'react'
import { toast } from 'sonner'
import { useInviteUser } from '../hooks/useInviteUser'
import { useLocations } from '../hooks/useLocations'
import { useFinancialControl, useUpdateBudget, useAddPurchase, type PurchaseRecord } from '../hooks/useFinancialControl'
import { useMonthlyFinancials } from '../hooks/useMonthlyFinancials'
import PageLayout from '../components/layout/PageLayout'
import ActivityLogsTable from '../components/admin/ActivityLogsTable'
import SettingsForm from '../components/admin/SettingsForm'
import UsersTable from '../components/admin/UsersTable'
import Modal from '../components/ui/Modal'
import LowStockTracker from '../components/admin/LowStockTracker'
import StockMovementsTable from '../components/admin/StockMovementsTable'
import SuppliersTable from '../components/admin/SuppliersTable'
import SupplierForm from '../components/admin/SupplierForm'
import LocationsTable from '../components/admin/LocationsTable'
import LocationForm from '../components/admin/LocationForm'
import PurchaseOrdersTable from '../components/admin/PurchaseOrdersTable'
import PurchaseOrderForm from '../components/admin/PurchaseOrderForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type TabKey = 'overview' | 'locations' | 'users' | 'orders' | 'lowStock' | 'suppliers' | 'movements' | 'activity'

function PanelCard({
  title,
  description,
  accent,
  children,
}: {
  title: string
  description: string
  accent: string
  children: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/95 shadow-[0_16px_45px_rgba(15,23,42,0.06)] backdrop-blur">
      <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
        <div>
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${accent}`} />
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          </div>
          <p className="mt-2 text-sm text-slate-500">{description}</p>
        </div>
        <span className="rounded-full bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          Active
        </span>
      </div>
      <div className="p-6">{children}</div>
    </section>
  )
}

export default function AdminPanel() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'staff' | 'demo'>('staff')
  const [locationId, setLocationId] = useState<string | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showSupplierModal, setShowSupplierModal] = useState(false)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [showPOModal, setShowPOModal] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>('overview')

  const [budgetInput, setBudgetInput] = useState<number>(() => {
    const saved = window.localStorage.getItem('inventory-budget')
    const parsed = Number(saved)
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 100000
  })

  const inviteUser = useInviteUser()
  const { data: locations } = useLocations()
  const { data: financialData } = useFinancialControl()
  const { data: monthlyFinancials } = useMonthlyFinancials()
  const updateBudget = useUpdateBudget()
  const addPurchase = useAddPurchase()

  const budget = financialData?.budget ?? budgetInput
  const spent = financialData?.spent ?? 0
  const recentPurchases = financialData?.recentPurchases ?? []

  const tabs: Array<{ key: TabKey; label: string; description: string }> = [
    { key: 'overview', label: 'Overview', description: 'Executive snapshot' },
    { key: 'locations', label: 'Locations', description: 'Site management' },
    { key: 'users', label: 'Users', description: 'Access control' },
    { key: 'orders', label: 'Orders', description: 'Procurement' },
    { key: 'lowStock', label: 'Low Stock', description: 'Reorder focus' },
    { key: 'suppliers', label: 'Suppliers', description: 'Vendor network' },
    { key: 'movements', label: 'Movements', description: 'Stock flow' },
    { key: 'activity', label: 'Activity', description: 'Audit trail' },
  ]

  const remaining = Math.max(budget - spent, 0)

  const lastMonthData = monthlyFinancials && monthlyFinancials.length > 0
    ? monthlyFinancials[monthlyFinancials.length - 1]
    : null

  function handlePurchaseRecorded(itemName: string, quantity: number, unitPrice: number, total: number) {
    addPurchase.mutate({ itemName, quantity, unitPrice, total })

    const saved = window.localStorage.getItem('inventory-spent')
    const currentSpent = Number(saved ?? 0)
    window.localStorage.setItem('inventory-spent', String(currentSpent + total))

    const savedPurchases = window.localStorage.getItem('inventory-purchases')
    const purchases: PurchaseRecord[] = savedPurchases
      ? (() => {
          try {
            return JSON.parse(savedPurchases)
          } catch {
            return []
          }
        })()
      : []
    purchases.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      item: itemName,
      quantity,
      unitPrice,
      total,
      date: new Date().toLocaleString(),
    })
    window.localStorage.setItem('inventory-purchases', JSON.stringify(purchases.slice(0, 5)))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    try {
      await inviteUser.mutateAsync({ email, password, role, locationId: locationId || undefined })
      toast.success(`User ${email} created successfully`)
      setEmail('')
      setPassword('')
      setRole('staff')
      setLocationId(null)
      setShowInviteModal(false)
    } catch (err) {
      toast.error(`Failed to create user: ${(err as Error).message}`)
    }
  }

  return (
    <PageLayout
      title="Admin Panel"
      onInviteUser={() => setShowInviteModal(true)}
      onSettings={() => setShowSettingsModal(true)}
      onAddSupplier={() => setShowSupplierModal(true)}
      onAddLocation={() => setShowLocationModal(true)}
      onAddPurchaseOrder={() => setShowPOModal(true)}
    >
      <div className="space-y-6">
        {/* Hero banner */}
        <div className="overflow-hidden rounded-[32px] border border-indigo-200 bg-gradient-to-br from-indigo-800 via-indigo-700 to-indigo-600 p-8 text-white shadow-[0_24px_70px_rgba(79,70,229,0.18)]">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Executive command center
              </div>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white">
                Manage inventory operations with precision
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-200">
                Control locations, users, suppliers, purchase orders, and stock movement activity from a refined, high-confidence workspace.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-100">Coverage</p>
                <p className="mt-2 text-lg font-semibold text-white">Multi-site</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-100">Access</p>
                <p className="mt-2 text-lg font-semibold text-white">Role-based</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-100">Audit</p>
                <p className="mt-2 text-lg font-semibold text-white">Trackable</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-2xl px-4 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-left">{tab.label}</div>
                  <div className={`mt-0.5 text-[11px] ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>
                    {tab.description}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {activeTab === 'overview' && (
          <PanelCard
            title="Operations Snapshot"
            description="A polished executive summary of your inventory ecosystem."
            accent="bg-indigo-600"
          >
            <div className="space-y-4">
              {/* Monthly Gross Sales & Acquisition Costs */}
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-xl">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-emerald-700">Monthly financials</p>
                    <h4 className="mt-1 text-lg font-semibold text-slate-900">Gross Sales & Acquisition Costs</h4>
                    <p className="mt-2 text-sm text-slate-600">
                      Revenue from sales orders vs stock acquisition costs for the current month.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-600">Monthly Gross Sales</p>
                    <p className="mt-2 text-2xl font-bold text-emerald-700">
                      GHS {lastMonthData ? lastMonthData.grossSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-amber-200 bg-white p-4">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-amber-600">Monthly Acquisition Costs</p>
                    <p className="mt-2 text-2xl font-bold text-amber-700">
                      GHS {lastMonthData ? lastMonthData.acquisitionCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                    </p>
                  </div>
                </div>

                {monthlyFinancials && monthlyFinancials.length > 0 && (
                  <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-900 mb-3">Last 12 months trend</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-slate-100">
                            <th className="text-left py-2 pr-4 font-medium text-slate-500">Month</th>
                            <th className="text-right py-2 pr-4 font-medium text-emerald-600">Gross Sales</th>
                            <th className="text-right py-2 font-medium text-amber-600">Acquisition Costs</th>
                          </tr>
                        </thead>
                        <tbody>
                          {monthlyFinancials.map((m) => (
                            <tr key={m.month} className="border-b border-slate-50 hover:bg-slate-50">
                              <td className="py-2 pr-4 text-slate-700">
                                {new Date(m.month + '-01').toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                              </td>
                              <td className="text-right py-2 pr-4 font-medium text-emerald-700">
                                GHS {m.grossSales.toFixed(2)}
                              </td>
                              <td className="text-right py-2 font-medium text-amber-700">
                                GHS {m.acquisitionCost.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {(!monthlyFinancials || monthlyFinancials.length === 0) && (
                  <div className="mt-4 rounded-xl bg-white p-4 text-center text-sm text-slate-500">
                    {monthlyFinancials === undefined ? 'Loading monthly data...' : 'No sales or purchase data yet.'}
                  </div>
                )}
              </div>

              {/* Budget / financial control */}
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/80 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-xl">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-indigo-600">Financial control</p>
                    <h4 className="mt-1 text-lg font-semibold text-slate-900">Budget remaining</h4>
                    <p className="mt-2 text-sm text-slate-600">
                      Every purchase is deducted automatically so you always know how much money is left.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Remaining balance</p>
                    <p className="mt-1 text-3xl font-semibold text-slate-900">
                      GHS {remaining.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-100 bg-white p-4">
                    <Label className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                      Starting budget
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={budget}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0
                        setBudgetInput(val)
                        updateBudget.mutate(val)
                      }}
                      className="mt-2"
                    />
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white p-4">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Spent</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">
                      GHS {spent.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white p-4">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Purchases</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">
                      {recentPurchases.length}
                    </p>
                  </div>
                </div>

                {recentPurchases.length > 0 && (
                  <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-900">Recent purchases</p>
                    <div className="mt-3 space-y-2">
                      {recentPurchases.map((purchase) => (
                        <div
                          key={purchase.id}
                          className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-900">{purchase.item}</p>
                            <p className="text-xs text-slate-500">
                              {purchase.quantity} × GHS {purchase.unitPrice.toFixed(2)} • {purchase.date}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-slate-900">
                            GHS {purchase.total.toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Inventory health</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Monitor branches, procurement flow, supplier relationships, and stock movement from a single premium workspace.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Sites</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">Multi-location</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Reorder</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">Low-stock focus</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Control</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">Role-based</p>
                </div>
              </div>
            </div>
          </PanelCard>
        )}

        {activeTab === 'locations' && (
          <PanelCard title="Locations" description="Manage branches and distribute access with clarity." accent="bg-sky-500">
            <LocationsTable />
          </PanelCard>
        )}

        {activeTab === 'users' && (
          <PanelCard title="User Management" description="Invite staff, assign roles, and maintain access controls." accent="bg-violet-500">
            <UsersTable />
          </PanelCard>
        )}

        {activeTab === 'orders' && (
          <PanelCard title="Purchase Orders" description="Review procurement activity and supplier commitments." accent="bg-emerald-500">
            <PurchaseOrdersTable />
          </PanelCard>
        )}

        {activeTab === 'lowStock' && (
          <PanelCard title="Low Stock Tracker" description="Stay ahead of shortages with a focused inventory view." accent="bg-amber-500">
            <LowStockTracker />
          </PanelCard>
        )}

        {activeTab === 'suppliers' && (
          <PanelCard title="Suppliers" description="Organize supplier details and purchasing relationships." accent="bg-rose-500">
            <SuppliersTable />
          </PanelCard>
        )}

        {activeTab === 'movements' && (
          <PanelCard title="Stock Movements" description="Track inventory changes and maintain operational visibility." accent="bg-cyan-500">
            <StockMovementsTable />
          </PanelCard>
        )}

        {activeTab === 'activity' && (
          <PanelCard title="Activity Log" description="Review the latest events for better oversight." accent="bg-indigo-600">
            <ActivityLogsTable />
          </PanelCard>
        )}
      </div>

      {showInviteModal && (
        <Modal title="Invite New User" onClose={() => setShowInviteModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="invite-email" className="mb-1 block">Email</Label>
              <Input id="invite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="invite-password" className="mb-1 block">Temporary Password</Label>
              <Input id="invite-password" type="text" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <div>
              <Label className="mb-1 block">Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as 'admin' | 'staff' | 'demo')}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="demo">Demo (read-only)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block">Location (staff will only see this location)</Label>
              <Select value={locationId ?? ''} onValueChange={(v) => setLocationId(v)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="All locations (admin default)" /></SelectTrigger>
                <SelectContent>
                  {locations?.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={inviteUser.isPending}>
              {inviteUser.isPending ? 'Creating...' : 'Create User'}
            </Button>
          </form>
        </Modal>
      )}

      {showSettingsModal && (
        <Modal title="System Settings" onClose={() => setShowSettingsModal(false)}>
          <SettingsForm />
        </Modal>
      )}

      {showSupplierModal && (
        <Modal title="Add Supplier" onClose={() => setShowSupplierModal(false)}>
          <SupplierForm onClose={() => setShowSupplierModal(false)} />
        </Modal>
      )}

      {showLocationModal && (
        <Modal title="Add Location" onClose={() => setShowLocationModal(false)}>
          <LocationForm onClose={() => setShowLocationModal(false)} />
        </Modal>
      )}

      {showPOModal && (
        <Modal title="New Purchase Order" onClose={() => setShowPOModal(false)}>
          <PurchaseOrderForm onClose={() => setShowPOModal(false)} onPurchaseRecorded={handlePurchaseRecorded} />
        </Modal>
      )}
    </PageLayout>
  )
}