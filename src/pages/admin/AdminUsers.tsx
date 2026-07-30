import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { useInviteUser } from '../../hooks/useInviteUser'
import { useLocations } from '../../hooks/useLocations'
import UsersTable from '../../components/admin/UsersTable'
import Modal from '../../components/ui/Modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function AdminUsers() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'staff' | 'demo'>('staff')
  const [locationId, setLocationId] = useState<string | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)

  const inviteUser = useInviteUser()
  const { data: locations } = useLocations()

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">User Management</h3>
          <p className="mt-1 text-sm text-slate-500">Invite staff, assign roles, and maintain access controls.</p>
        </div>
        <Button onClick={() => setShowInviteModal(true)} className="bg-indigo-600 hover:bg-indigo-700">
          Invite User
        </Button>
      </div>

      <UsersTable />

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
    </div>
  )
}

