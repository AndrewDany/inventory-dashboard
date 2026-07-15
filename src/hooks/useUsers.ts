import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '../lib/supabaseClient'
import type { Profile } from '../types/profile'

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)
      return data as Profile[]
    },
  })
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'suspended' }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success(
        variables.status === 'suspended' ? 'User suspended' : 'User reactivated'
      )
    },
    onError: (error) => {
      toast.error(`Failed to update user: ${error.message}`)
    },
  })
}

export function useUpdateUserLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, locationId }: { id: string; locationId: string | null }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ location_id: locationId })
        .eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User location updated')
    },
    onError: (error) => {
      toast.error(`Failed to update location: ${error.message}`)
    },
  })
}