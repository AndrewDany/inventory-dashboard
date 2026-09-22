import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/apiClient'

export interface ActivityLog {
  id: string
  user_id: string | null
  user_email: string
  action: string
  item_name: string
  created_at: string
}

export function useActivityLogs() {
  return useQuery({
    queryKey: ['activity_logs'],
    queryFn: async (): Promise<ActivityLog[]> => {
      const data = await api.get<ActivityLog[]>('/audit/activity-logs?limit=50')
      return data || []
    },
  })
}