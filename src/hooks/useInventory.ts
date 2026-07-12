import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '../lib/supabaseClient'
import type { InventoryItem } from '../types/inventory'
import type { InventoryFormValues } from '../lib/schemas'

async function logActivity(action: 'created' | 'updated' | 'deleted', itemName: string) {
  const { data: sessionData } = await supabase.auth.getSession()
  const user = sessionData.session?.user
  if (!user) return

  await supabase.from('activity_logs').insert({
    user_id: user.id,
    user_email: user.email,
    action,
    item_name: itemName,
  })
}

async function logStockMovement(
  itemId: string,
  itemName: string,
  previousQuantity: number,
  newQuantity: number
) {
  if (previousQuantity === newQuantity) return

  const { data: sessionData } = await supabase.auth.getSession()
  const user = sessionData.session?.user
  if (!user) return

  await supabase.from('stock_movements').insert({
    item_id: itemId,
    item_name: itemName,
    previous_quantity: previousQuantity,
    new_quantity: newQuantity,
    change_amount: newQuantity - previousQuantity,
    user_id: user.id,
    user_email: user.email,
  })
}

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
      await logActivity('created', values.name)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_items'] })
      queryClient.invalidateQueries({ queryKey: ['activity_logs'] })
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
    mutationFn: async ({
      id,
      values,
      previousQuantity,
    }: {
      id: string
      values: InventoryFormValues
      previousQuantity: number
    }) => {
      const { error } = await supabase
        .from('inventory_items')
        .update(values)
        .eq('id', id)
      if (error) throw new Error(error.message)

      await logActivity('updated', values.name)
      await logStockMovement(id, values.name, previousQuantity, values.quantity)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_items'] })
      queryClient.invalidateQueries({ queryKey: ['activity_logs'] })
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] })
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
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from('inventory_items').delete().eq('id', id)
      if (error) throw new Error(error.message)
      await logActivity('deleted', name)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_items'] })
      queryClient.invalidateQueries({ queryKey: ['activity_logs'] })
      toast.success('Item deleted successfully')
    },
    onError: (error) => {
      toast.error(`Failed to delete item: ${error.message}`)
    },
  })
}