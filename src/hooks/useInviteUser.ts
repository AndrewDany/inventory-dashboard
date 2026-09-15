import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'

interface InviteUserParams {
  email: string
  password: string
  role: 'admin' | 'staff' | 'demo'
  locationId?: string
}

export function useInviteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ email, password, role, locationId }: InviteUserParams) => {
      return await api.post('/auth/invite', {
        email,
        password,
        role,
        location_id: locationId,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}