// src/hooks/useSalesOrders.ts
// ------------------------------------------------------------
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '../lib/supabaseClient'
import type { SalesOrder, SalesOrderItem } from '../types/procurement'

export interface SalesOrderWithItems extends SalesOrder {
  sales_order_items: SalesOrderItem[]
}

export function useSalesOrders() {
  return useQuery({
    queryKey: ['sales_orders'],
    queryFn: async (): Promise<SalesOrderWithItems[]> => {
      const { data, error } = await supabase
        .from('sales_orders')
        .select('*, sales_order_items(*)')
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)
      return data as SalesOrderWithItems[]
    },
  })
}

interface CreateSOInput {
  so_number: string
  notes?: string
  items: { sku: string; inventory_item_id?: number; quantity_ordered: number; unit_price?: number; currency?: string }[]
}

export function useCreateSalesOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateSOInput) => {
      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData.session?.user.id
      if (!userId) throw new Error('Not authenticated')

      const { data: so, error: soError } = await supabase
        .from('sales_orders')
        .insert({
          so_number: input.so_number,
          notes: input.notes ?? null,
          status: 'confirmed',
          created_by: userId,
        })
        .select()
        .single()

      if (soError) throw new Error(soError.message)

      const itemRows = input.items.map((item) => ({
        so_id: so.id,
        sku: item.sku,
        inventory_item_id: item.inventory_item_id ?? null,
        quantity_ordered: item.quantity_ordered,
        unit_price: item.unit_price ?? null,
        currency: item.currency ?? null,
      }))

      const { error: itemsError } = await supabase.from('sales_order_items').insert(itemRows)
      if (itemsError) throw new Error(itemsError.message)

      return so
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales_orders'] })
      toast.success('Sales order created')
    },
    onError: (error: Error) => {
      toast.error(`Failed to create sales order: ${error.message}`)
    },
  })
}

interface ShipSOInput {
  so_id: string
  location_id: string
  items?: { item_id: string; quantity: number }[] // omit for full shipment
}

export function useShipSalesOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ so_id, location_id, items }: ShipSOInput) => {
      const { data, error } = await supabase.rpc('ship_sales_order', {
        p_so_id: so_id,
        p_location_id: location_id,
        p_items: items ?? null,
      })

      if (error) throw new Error(error.message)

      // Surface partial-shipment shortfalls as a warning, not just a generic success
      const result = data as { complete: boolean; lines: { sku: string; shortfall: number }[] }
      if (!result.complete) {
        const shortLines = result.lines.filter((l) => l.shortfall > 0)
        if (shortLines.length > 0) {
          toast.warning(
            `Partially shipped — insufficient stock for: ${shortLines.map((l) => l.sku).join(', ')}`
          )
        }
      }

      return data
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['sales_orders'] })
      queryClient.invalidateQueries({ queryKey: ['inventory_items'] })
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] })
      queryClient.invalidateQueries({ queryKey: ['inventory_batches'] })
      if (data?.complete) {
        toast.success('Sales order shipped — stock deducted')
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to ship sales order: ${error.message}`)
    },
  })
}
