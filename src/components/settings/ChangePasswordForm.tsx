import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { useChangePassword } from '../../hooks/useChangePassword'
import { Button } from '@/components/ui/button'

export default function ChangePasswordForm() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const changePassword = useChangePassword()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    try {
      await changePassword.mutateAsync(newPassword)
      toast.success('Password updated successfully')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast.error(`Failed to update password: ${(err as Error).message}`)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-md">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Change Password</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>

        <Button type="submit" className="w-full" disabled={changePassword.isPending}>
          {changePassword.isPending ? 'Updating...' : 'Update Password'}
        </Button>
      </form>
    </div>
  )
}