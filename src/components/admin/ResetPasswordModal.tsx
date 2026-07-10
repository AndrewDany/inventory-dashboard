import { useState, type FormEvent } from 'react'
import { useResetPassword } from '../../hooks/useResetPassword'

export default function ResetPasswordModal({
  userId,
  userEmail,
  onClose,
}: {
  userId: string
  userEmail: string
  onClose: () => void
}) {
  const [newPassword, setNewPassword] = useState('')
  const resetPassword = useResetPassword()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    await resetPassword.mutateAsync({ userId, newPassword })
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-600">
        Set a new password for <strong>{userEmail}</strong>
      </p>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
        <input
          type="text"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={6}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={resetPassword.isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {resetPassword.isPending ? 'Resetting...' : 'Reset Password'}
        </button>
      </div>
    </form>
  )
}