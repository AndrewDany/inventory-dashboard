import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { useInviteUser } from '../hooks/useInviteUser'
import PageLayout from '../components/layout/PageLayout'
import ActivityLogsTable from '../components/admin/ActivityLogsTable'
import SettingsForm from '../components/admin/SettingsForm'
export default function AdminPanel() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'staff'>('staff')

  const inviteUser = useInviteUser()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    try {
      await inviteUser.mutateAsync({ email, password, role })
      toast.success(`User ${email} created successfully`)
      setEmail('')
      setPassword('')
      setRole('staff')
    } catch (err) {
      toast.error(`Failed to create user: ${(err as Error).message}`)
    }
  }

  return (
    <PageLayout title="Admin Panel">
      <div className="flex justify-center mb-8">
        <div className="bg-white rounded-lg shadow p-6 max-w-md w-full">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Invite New User</h2>

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
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'staff')}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={inviteUser.isPending}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {inviteUser.isPending ? 'Creating...' : 'Create User'}
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
        <ActivityLogsTable />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">System Settings</h2>
        <SettingsForm />
      </div>
    </PageLayout>
  )
}