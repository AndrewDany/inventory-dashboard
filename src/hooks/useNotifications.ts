import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'danger' | 'success'
  created_at: string
  read: boolean
  action?: string
  item_name?: string
  user_email?: string
  user_id?: string | null
}

interface RawNotification {
  id: string
  title?: string
  message?: string
  type?: string
  is_read?: number | boolean
  user_id?: string | null
  user_email?: string
  action?: string
  item_name?: string
  created_at: string
}

export function useNotifications(limit = 30) {
  return useQuery({
    queryKey: ['notifications', limit],
    queryFn: async (): Promise<Notification[]> => {
      const data = await api.get<RawNotification[]>('/notifications')
      const items = data || []
      const readIds = getReadIds()

      return items.map((n: RawNotification) => ({
        id: n.id,
        title: n.title ?? n.action ?? 'System Alert',
        message: n.message ?? n.item_name ?? '',
        type: (n.type as 'info' | 'warning' | 'danger' | 'success') ?? 'info',
        action: n.action ?? n.title ?? 'Alert',
        item_name: n.item_name ?? n.message ?? '',
        user_email: n.user_email ?? 'System',
        user_id: n.user_id ?? null,
        created_at: n.created_at,
        read: Boolean(n.is_read) || readIds.has(n.id),
      }))
    },
    refetchInterval: 15_000, // poll every 15s for live alerts
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
      localStorage.removeItem('notification_read_ids')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}