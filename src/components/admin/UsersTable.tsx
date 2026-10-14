import { useState } from 'react'
import { LogIn, LogOut, Shield, User } from 'lucide-react'
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
import { relativeTime } from '../../lib/relativeTime'
import type { Profile } from '../../types/profile'

export default function UsersTable() {
  const { data: users, isLoading, error } = useUsers()
  const { data: locations, isLoading: locationsLoading } = useLocations()
  const updateStatus = useUpdateUserStatus()
  const updateLocation = useUpdateUserLocation()
  const [resetTarget, setResetTarget] = useState<Profile | null>(null)

  if (isLoading || locationsLoading) return <p className="text-gray-500 text-sm py-4">Loading users & staff sessions...</p>
  if (error) return <p className="text-red-600 text-sm py-4">Error: {error.message}</p>
  if (!users || users.length === 0) return <p className="text-gray-500 text-sm py-4">No users found.</p>

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 dark:bg-slate-800/50">
              <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Staff Account</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Role</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Location</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Session Status</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Last Login</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Last Logout</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const hasLoggedIn = Boolean(user.last_login_at)
              const isOnline = Boolean(
                user.last_login_at &&
                (!user.last_logout_at || new Date(user.last_login_at).getTime() > new Date(user.last_logout_at).getTime()) &&
                user.status === 'active'
              )

              return (
                <TableRow key={user.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {user.role === 'admin' ? <Shield size={16} /> : <User size={16} />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 dark:text-slate-100 truncate text-sm">
                          {user.full_name || user.email.split('@')[0]}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="capitalize text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                      user.role === 'admin'
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                        : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    }`}>
                      {user.role}
                    </span>
                  </TableCell>

                  <TableCell>
                    <Select
                      value={user.location_id ?? 'all'}
                      onValueChange={(v) =>
                        updateLocation.mutate({ id: user.id, locationId: v === 'all' ? null : v })
                      }
                    >
                      <SelectTrigger className="w-36 h-8 text-xs">
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
                    <div className="flex flex-col gap-1 items-start">
                      <Badge variant={user.status === 'active' ? 'default' : 'destructive'} className="capitalize text-[10px]">
                        {user.status}
                      </Badge>
                      {isOnline && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Online Now
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    {hasLoggedIn ? (
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300" title={user.last_login_at ? new Date(user.last_login_at).toLocaleString() : ''}>
                        <LogIn size={13} className="text-blue-500 shrink-0" />
                        <span className="whitespace-nowrap">{relativeTime(user.last_login_at!)}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Never</span>
                    )}
                  </TableCell>

                  <TableCell>
                    {user.last_logout_at ? (
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300" title={new Date(user.last_logout_at).toLocaleString()}>
                        <LogOut size={13} className="text-amber-500 shrink-0" />
                        <span className="whitespace-nowrap">{relativeTime(user.last_logout_at)}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </TableCell>

                  <TableCell className="text-right space-x-1 whitespace-nowrap">
                    {user.status === 'active' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-rose-50 text-xs h-8"
                        onClick={() => updateStatus.mutate({ id: user.id, status: 'suspended' })}
                        disabled={updateStatus.isPending}
                      >
                        Suspend
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 text-xs h-8"
                        onClick={() => updateStatus.mutate({ id: user.id, status: 'active' })}
                        disabled={updateStatus.isPending}
                      >
                        Reactivate
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => setResetTarget(user)}>
                      Reset Password
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

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