import { useMutation } from '@tanstack/react-query'
import { api } from '../lib/apiClient'

export function useChangePassword() {
  return useMutation({
    mutationFn: async (newPassword: string) => {
      await api.post('/auth/change-password', { password: newPassword })
    },
  })
}