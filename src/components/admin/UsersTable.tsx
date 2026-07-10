import { useState } from 'react'
import { useUsers, useUpdateUserStatus } from '../../hooks/useUsers'
import Modal from '../ui/Modal'
import ResetPasswordModal from './ResetPasswordModal'
import type { Profile } from '../../types/profile'

export default function UsersTable() {
  const { data: users, isLoading, error } = useUsers()
  const updateStatus = useUpdateUserStatus()
  const [resetTarget, setResetTarget] = useState<Profile | null>(null)

  if (isLoading) return <p className="text-gray-500 text-sm">Loading users...</p>
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>
  if (!users || users.length === 0) return <p className="text-gray-500 text-sm">No users found.</p>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="p-3">Email</th>
            <th className="p-3">Role</th>
            <th className="p-3">Status</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b">
              <td className="p-3">{user.email}</td>
              <td className="p-3 capitalize">{user.role}</td>
              <td className="p-3">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                    user.status === 'active'
                      ? 'text-green-700 bg-green-50'
                      : 'text-red-700 bg-red-50'
                  }`}
                >
                  {user.status}
                </span>
              </td>
              <td className="p-3 space-x-3">
                {user.status === 'active' ? (
                  <button
                    onClick={() => updateStatus.mutate({ id: user.id, status: 'suspended' })}
                    disabled={updateStatus.isPending}
                    className="text-red-600 hover:underline text-sm disabled:opacity-50"
                  >
                    Suspend
                  </button>
                ) : (
                  <button
                    onClick={() => updateStatus.mutate({ id: user.id, status: 'active' })}
                    disabled={updateStatus.isPending}
                    className="text-green-600 hover:underline text-sm disabled:opacity-50"
                  >
                    Reactivate
                  </button>
                )}
                <button
                  onClick={() => setResetTarget(user)}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Reset Password
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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