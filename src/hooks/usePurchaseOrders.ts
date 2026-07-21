// src/hooks/usePurchaseOrders.ts
// ------------------------------------------------------------
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '../lib/supabaseClient'
import type { PurchaseOrder, PurchaseOrderItem } from '../types/procurement'

export interface PurchaseOrderWithItems extends PurchaseOrder {
  purchase_order_items: PurchaseOrderItem[]
}

export function usePurchaseOrders() {
  return useQuery({
    queryKey: ['purchase_orders'],
    queryFn: async (): Promise<PurchaseOrderWithItems[]> => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*, purchase_order_items(*)')
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)
      return data as PurchaseOrderWithItems[]
    },
  })
}

interface CreatePOInput {
  po_number: string
  supplier_id?: string
  notes?: string
  items: { sku: string; inventory_item_id?: number; quantity_ordered: number; unit_cost?: number; currency?: string }[]
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreatePOInput) => {
      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData.session?.user.id
      if (!userId) throw new Error('Not authenticated')

      const { data: po, error: poError } = await supabase
        .from('purchase_orders')
        .insert({
          po_number: input.po_number,
          supplier_id: input.supplier_id ?? null,
          notes: input.notes ?? null,
          status: 'ordered',
          created_by: userId,
        })
        .select()
        .single()

      if (poError) throw new Error(poError.message)

      const itemRows = input.items.map((item) => ({
        po_id: po.id,
        sku: item.sku,
        inventory_item_id: item.inventory_item_id ?? null,
        quantity_ordered: item.quantity_ordered,
        unit_cost: item.unit_cost ?? null,
        currency: item.currency ?? null,
      }))

      const { error: itemsError } = await supabase.from('purchase_order_items').insert(itemRows)
      if (itemsError) throw new Error(itemsError.message)

      return po
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase_orders'] })
      toast.success('Purchase order created')
    },
    onError: (error: Error) => {
      toast.error(`Failed to create purchase order: ${error.message}`)
    },
  })
}

interface ReceivePOInput {
  po_id: string
  location_id: string
  items?: { item_id: string; quantity: number }[] // omit for full receipt
}

export function useReceivePurchaseOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ po_id, location_id, items }: ReceivePOInput) => {
      const { data, error } = await supabase.rpc('receive_purchase_order', {
        p_po_id: po_id,
        p_location_id: location_id,
        p_items: items ?? null,
      })

      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase_orders'] })
      queryClient.invalidateQueries({ queryKey: ['inventory_items'] })
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] })
      queryClient.invalidateQueries({ queryKey: ['inventory_batches'] })
      toast.success('Purchase order received — stock updated')
    },
    onError: (error: Error) => {
      toast.error(`Failed to receive purchase order: ${error.message}`)
    },
  })
}
