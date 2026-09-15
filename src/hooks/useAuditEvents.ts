import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type { AuditEvent } from '../types/procurement'

export function useAuditEvents(limit = 100) {
  return useQuery({
    queryKey: ['audit_events', limit],
    queryFn: async (): Promise<AuditEvent[]> => {
      const data = await api.get<AuditEvent[]>(`/audit/events?limit=${limit}`)
      return data || []
    },
  })
}
