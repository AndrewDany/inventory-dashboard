// src/hooks/useAuditEvents.ts
// ------------------------------------------------------------
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import type { AuditEvent } from '../types/procurement'

export function useAuditEvents(limit = 100) {
  return useQuery({
    queryKey: ['audit_events', limit],
    queryFn: async (): Promise<AuditEvent[]> => {
      const { data, error } = await supabase
        .from('audit_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw new Error(error.message)
      return data as AuditEvent[]
    },
  })
}

// ------------------------------------------------------------
// src/hooks/useValuation.ts
// ------------------------------------------------------------
