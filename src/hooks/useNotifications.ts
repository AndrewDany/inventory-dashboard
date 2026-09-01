import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'

export interface Notification {
  id: string
  user_id: string | null
  user_email: string
  action: string
  item_name: string
  created_at: string
  read: boolean
}

export function useNotifications(limit = 20) {
  return useQuery({
    queryKey: ['notifications', limit],
    queryFn: async (): Promise<Notification[]> => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw new Error(error.message)

      // We use a local storage mechanism for "read" state since there's no read column
      const readIds = getReadIds()
      return (data as Notification[]).map((n) => ({
        ...n,
        read: readIds.has(n.id),
      }))
    },
    refetchInterval: 30_000, // poll every 30s
  })
}

function getReadIds(): Set<string> {
  try {
    const stored = localStorage.getItem('notification_read_ids')
    return new Set<string>(stored ? JSON.parse(stored) : [])
  } catch {
    return new Set()
  }
}

function saveReadIds(ids: Set<string>) {
  localStorage.setItem('notification_read_ids', JSON.stringify(Array.from(ids)))
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const readIds = getReadIds()
      readIds.add(id)
      saveReadIds(readIds)
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const { data } = await supabase
        .from('activity_logs')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(50)

      if (!data) return

      const readIds = getReadIds()
      for (const d of data as { id: string }[]) {
        readIds.add(d.id)
      }
      saveReadIds(readIds)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}