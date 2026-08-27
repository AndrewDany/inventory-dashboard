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
  newQuantity: number,
  reason: 'manual_adjustment' | 'purchase' | 'sale' | 'write_off' | 'return' | 'cycle_count' | 'transfer' | 'other' = 'manual_adjustment'
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
    // FIX: 'inventory_update' is not an allowed value in
    // stock_movements_reason_check (only purchase/sale/manual_adjustment/
    // write_off/return/cycle_count/transfer/other are). This was silently
    // failing on every quantity edit, breaking the audit trail.
    reason,
    user_id: user.id,
    user_email: user.email,
  })
}

async function checkAndSendLowStockAlert(
  itemName: string,
  newQuantity: number,
  reorderLevel: number,
  previousQuantity: number
) {
  const wasAboveReorder = previousQuantity > reorderLevel
  const isNowAtOrBelowReorder = newQuantity <= reorderLevel

  console.log('Low stock check:', {
    itemName,
    previousQuantity,
    newQuantity,
    reorderLevel,
    wasAboveReorder,
    isNowAtOrBelowReorder,
    willTrigger: wasAboveReorder && isNowAtOrBelowReorder,
  })

  if (!(wasAboveReorder && isNowAtOrBelowReorder)) return

  try {
    const result = await supabase.functions.invoke('send-low-stock-alert', {
      body: { itemName, quantity: newQuantity, reorderLevel },
    })
    console.log('Low stock alert function result:', result)
  } catch (err) {
    console.error('Failed to send low stock alert:', err)
  }
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
      const { data, error } = await supabase
        .from('inventory_items')
        .insert([values])
        .select()
        .single()
      if (error) throw new Error(error.message)

      await logActivity('created', values.name)
      // Log a movement so a manually-entered starting quantity leaves an
      // audit trail instead of appearing with no history at all.
      if (values.quantity > 0) {
        await logStockMovement(data.id, values.name, 0, values.quantity, 'manual_adjustment')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_items'] })
      queryClient.invalidateQueries({ queryKey: ['activity_logs'] })
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] })
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
      await checkAndSendLowStockAlert(values.name, values.quantity, values.reorder_level, previousQuantity)
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