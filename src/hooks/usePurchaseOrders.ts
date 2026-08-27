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
      // Header + line items are inserted atomically server-side via the
      // create_purchase_order RPC, so a bad line item can't leave an
      // orphaned PO header behind (see supabase/create-purchase-order.sql).
      const { data, error } = await supabase.rpc('create_purchase_order', {
        p_po_number: input.po_number,
        p_supplier_id: input.supplier_id ?? null,
        p_notes: input.notes ?? null,
        p_items: input.items,
      })

      if (error) throw new Error(error.message)
      return data
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