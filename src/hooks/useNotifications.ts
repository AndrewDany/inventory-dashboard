import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'

export interface Notification {
  id: string
  user_id: string | null
  user_email: string
  action: string
  item_name: string
  created_at: string
  read: boolean
}

interface RawNotification {
  id: string
  title?: string
  message?: string
  is_read?: number | boolean
  user_id?: string | null
  user_email?: string
  action?: string
  item_name?: string
  created_at: string
}

export function useNotifications(limit = 20) {
  return useQuery({
    queryKey: ['notifications', limit],
    queryFn: async (): Promise<Notification[]> => {
      const data = await api.get<RawNotification[]>('/notifications')
      const items = data || []
      const readIds = getReadIds()

      return items.map((n: RawNotification) => ({
        id: n.id,
        user_id: n.user_id ?? null,
        user_email: n.user_email ?? 'system',
        action: n.action ?? n.title ?? 'Alert',
        item_name: n.item_name ?? n.message ?? '',
        created_at: n.created_at,
        read: Boolean(n.is_read) || readIds.has(n.id),
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
      try {
        await api.patch(`/notifications/${id}/read`, {})
      } catch {
        // Fall back gracefully to localStorage
      }
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
      try {
        await api.post('/notifications/read-all', {})
      } catch {
        // Fall back gracefully to localStorage
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}