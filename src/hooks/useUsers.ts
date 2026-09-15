import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '../lib/apiClient'
import type { Profile } from '../types/profile'

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<Profile[]> => {
      const data = await api.get<any[]>('/users')
      return (data || []).map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        full_name: u.full_name,
        avatar_url: u.avatar_url,
        created_at: u.created_at,
        status: 'active',
      })) as Profile[]
    },
  })
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'suspended' }) => {
      await api.patch(`/users/${id}`, { status })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success(
        variables.status === 'suspended' ? 'User suspended' : 'User reactivated'
      )
    },
    onError: (error: Error) => {
      toast.error(`Failed to update user: ${error.message}`)
    },
  })
}

export function useUpdateUserLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, locationId }: { id: string; locationId: string | null }) => {
      await api.patch(`/users/${id}`, { location_id: locationId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User location updated')
    },
    onError: (error: Error) => {
      toast.error(`Failed to update location: ${error.message}`)
    },
  })
}