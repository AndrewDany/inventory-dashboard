import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '../lib/supabaseClient'

export interface Setting {
  key: string
  value: string
}

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async (): Promise<Record<string, string>> => {
      const { data, error } = await supabase.from('settings').select('*')
      if (error) throw new Error(error.message)

      const settingsMap: Record<string, string> = {}
      ;(data as Setting[]).forEach((s) => {
        settingsMap[s.key] = s.value
      })
      return settingsMap
    },
  })
}

export function useUpdateSetting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from('settings')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast.success('Settings updated')
    },
    onError: (error) => {
      toast.error(`Failed to update settings: ${error.message}`)
    },
  })
}