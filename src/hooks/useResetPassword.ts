import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '../lib/apiClient'

export function useResetPassword() {
  return useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      return await api.post(`/users/${userId}/reset-password`, {
        new_password: newPassword,
      })
    },
    onSuccess: () => {
      toast.success('Password reset successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to reset password: ${error.message}`)
    },
  })
}