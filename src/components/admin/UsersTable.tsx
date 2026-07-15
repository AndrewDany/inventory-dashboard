import { useState } from 'react'
import { useUsers, useUpdateUserStatus, useUpdateUserLocation } from '../../hooks/useUsers'
import { useLocations } from '../../hooks/useLocations'
import Modal from '../ui/Modal'
import ResetPasswordModal from './ResetPasswordModal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Profile } from '../../types/profile'

export default function UsersTable() {
  const { data: users, isLoading, error } = useUsers()
  const { data: locations, isLoading: locationsLoading } = useLocations()
  const updateStatus = useUpdateUserStatus()
  const updateLocation = useUpdateUserLocation()
  const [resetTarget, setResetTarget] = useState<Profile | null>(null)

  if (isLoading || locationsLoading) return <p className="text-gray-500 text-sm">Loading users...</p>
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>
  if (!users || users.length === 0) return <p className="text-gray-500 text-sm">No users found.</p>

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.email}</TableCell>
              <TableCell className="capitalize">{user.role}</TableCell>
              <TableCell>
                <Select
                  value={user.location_id ?? 'all'}
                  onValueChange={(v) =>
                    updateLocation.mutate({ id: user.id, locationId: v === 'all' ? null : v })
                  }
                >
                  <SelectTrigger className="w-40 h-8 text-sm">
                    <SelectValue>
                      {user.location_id
                        ? locations?.find((l) => l.id === user.location_id)?.name ?? 'Unknown'
                        : 'All locations'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All locations</SelectItem>
                    {locations?.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Badge variant={user.status === 'active' ? 'default' : 'destructive'} className="capitalize">
                  {user.status}
                </Badge>
              </TableCell>
              <TableCell className="space-x-2">
                {user.status === 'active' ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => updateStatus.mutate({ id: user.id, status: 'suspended' })}
                    disabled={updateStatus.isPending}
                  >
                    Suspend
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-green-600 hover:text-green-700"
                    onClick={() => updateStatus.mutate({ id: user.id, status: 'active' })}
                    disabled={updateStatus.isPending}
                  >
                    Reactivate
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setResetTarget(user)}>
                  Reset Password
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {resetTarget && (
        <Modal title="Reset Password" onClose={() => setResetTarget(null)}>
          <ResetPasswordModal
            userId={resetTarget.id}
            userEmail={resetTarget.email}
            onClose={() => setResetTarget(null)}
          />
        </Modal>
      )}
    </div>
  )
}