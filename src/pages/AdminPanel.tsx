import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { useInviteUser } from '../hooks/useInviteUser'
import PageLayout from '../components/layout/PageLayout'
import ActivityLogsTable from '../components/admin/ActivityLogsTable'
import SettingsForm from '../components/admin/SettingsForm'
import UsersTable from '../components/admin/UsersTable'
import Modal from '../components/ui/Modal'
import LowStockTracker from '../components/admin/LowStockTracker'
import StockMovementsTable from '../components/admin/StockMovementsTable'
import SuppliersTable from '../components/admin/SuppliersTable'
import SupplierForm from '../components/admin/SupplierForm'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function AdminPanel() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'staff' | 'demo'>('staff')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showSupplierModal, setShowSupplierModal] = useState(false)

  const inviteUser = useInviteUser()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    try {
      await inviteUser.mutateAsync({ email, password, role })
      toast.success(`User ${email} created successfully`)
      setEmail('')
      setPassword('')
      setRole('staff')
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
    >
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">User Management</h2>
        <UsersTable />
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Low Stock Tracker</h2>
        <LowStockTracker />
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Suppliers</h2>
        <SuppliersTable />
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Stock Movements</h2>
        <StockMovementsTable />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
        <ActivityLogsTable />
      </div>

      {showInviteModal && (
        <Modal title="Invite New User" onClose={() => setShowInviteModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <Select value={role} onValueChange={(v) => setRole(v as 'admin' | 'staff' | 'demo')}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="demo">Demo (read-only)</SelectItem>
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
    </PageLayout>
  )
}