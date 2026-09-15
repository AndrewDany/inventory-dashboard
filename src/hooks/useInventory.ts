import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '../lib/apiClient'
import type { InventoryItem } from '../types/inventory'
import type { InventoryFormValues } from '../lib/schemas'

export function useInventory() {
  return useQuery({
    queryKey: ['inventory_items'],
    queryFn: async (): Promise<InventoryItem[]> => {
      const data = await api.get<InventoryItem[]>('/inventory')
      return data || []
    },
  })
}

export function useAddInventoryItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: InventoryFormValues) => {
      await api.post<InventoryItem>('/inventory', values)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_items'] })
      queryClient.invalidateQueries({ queryKey: ['activity_logs'] })
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Item added successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to add item: ${error.message}`)
    },
  })
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string
      values: InventoryFormValues
      previousQuantity?: number
    }) => {
      await api.put<InventoryItem>(`/inventory/${id}`, values)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_items'] })
      queryClient.invalidateQueries({ queryKey: ['activity_logs'] })
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Item updated successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to update item: ${error.message}`)
    },
  })
}

export function useDeleteInventoryItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: string; name?: string }) => {
      await api.delete(`/inventory/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_items'] })
      queryClient.invalidateQueries({ queryKey: ['activity_logs'] })
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] })
      toast.success('Item deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete item: ${error.message}`)
    },
  })
}