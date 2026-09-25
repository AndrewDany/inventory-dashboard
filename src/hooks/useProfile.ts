import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import { useAuth } from './useAuth'
import type { Profile } from '../types/profile'

export function useProfile() {
  const { session } = useAuth()

  return useQuery({
    queryKey: ['profile', session?.user.id],
    queryFn: async (): Promise<Profile> => {
      const data = await api.get<Profile>('/auth/me')
      return data
    },
    enabled: Boolean(session?.user.id),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  })
}