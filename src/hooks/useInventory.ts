import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '../lib/supabaseClient'
import type { InventoryItem } from '../types/inventory'
import type { InventoryFormValues } from '../lib/schemas'

export function useInventory() {
  return useQuery({
    queryKey: ['inventory_items'],
    queryFn: async (): Promise<InventoryItem[]> => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)
      return data as InventoryItem[]
    },
  })
}

export function useAddInventoryItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: InventoryFormValues) => {
      const { error } = await supabase.from('inventory_items').insert([values])
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_items'] })
      toast.success('Item added successfully')
    },
    onError: (error) => {
      toast.error(`Failed to add item: ${error.message}`)
    },
  })
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: InventoryFormValues }) => {
      const { error } = await supabase
        .from('inventory_items')
        .update(values)
        .eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_items'] })
      toast.success('Item updated successfully')
    },
    onError: (error) => {
      toast.error(`Failed to update item: ${error.message}`)
    },
  })
}

export function useDeleteInventoryItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('inventory_items').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_items'] })
      toast.success('Item deleted successfully')
    },
    onError: (error) => {
      toast.error(`Failed to delete item: ${error.message}`)
    },
  })
}