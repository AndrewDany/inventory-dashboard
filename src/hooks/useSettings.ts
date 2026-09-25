import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '../lib/apiClient'

export interface Setting {
  key: string
  value: string
}

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async (): Promise<Record<string, string>> => {
      const data = await api.get<Record<string, string>>('/settings')
      return data || {}
    },
  })
}

export function useUpdateSetting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      await api.post('/settings', { [key]: value })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast.success('Settings updated')
    },
    onError: (error: Error) => {
      toast.error(`Failed to update settings: ${error.message}`)
    },
  })
}
