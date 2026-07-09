import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'

export interface ActivityLog {
  id: string
  user_id: string | null
  user_email: string
  action: 'created' | 'updated' | 'deleted'
  item_name: string
  created_at: string
}

export function useActivityLogs() {
  return useQuery({
    queryKey: ['activity_logs'],
    queryFn: async (): Promise<ActivityLog[]> => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw new Error(error.message)
      return data as ActivityLog[]
    },
  })
}