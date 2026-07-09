import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './useAuth'
import type { Profile } from '../types/profile'

export function useProfile() {
  const { session } = useAuth()

  return useQuery({
    queryKey: ['profile', session?.user.id],
    queryFn: async (): Promise<Profile> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session!.user.id)
        .single()

      if (error) throw new Error(error.message)
      return data as Profile
    },
    enabled: Boolean(session?.user.id),
  })
}