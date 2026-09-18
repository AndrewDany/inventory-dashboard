import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '../lib/apiClient'
import type { PurchaseOrder, PurchaseOrderItem } from '../types/procurement'

export interface PurchaseOrderWithItems extends PurchaseOrder {
  purchase_order_items: PurchaseOrderItem[]
}

export function usePurchaseOrders() {
  return useQuery({
    queryKey: ['purchase_orders'],
    queryFn: async (): Promise<PurchaseOrderWithItems[]> => {
      const data = await api.get<any[]>('/purchase-orders')
      return (data || []).map((po) => ({
        ...po,
        purchase_order_items: po.items || po.purchase_order_items || [],
      }))
    },
  })
}

interface CreatePOInput {
  po_number: string
  supplier_id?: string
  notes?: string
  items: { sku: string; inventory_item_id?: string; quantity_ordered: number; unit_cost?: number; currency?: string }[]
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreatePOInput) => {
      return await api.post('/purchase-orders', input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase_orders'] })
      queryClient.invalidateQueries({ queryKey: ['budget'] })
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
  items?: { item_id?: string; sku?: string; quantity_received?: number; quantity?: number; unit_cost?: number; location_id?: string }[]
}

export function useReceivePurchaseOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ po_id, location_id, items }: ReceivePOInput) => {
      const formattedItems = (items || []).map((i) => ({
        sku: i.sku || '',
        quantity_received: i.quantity_received || i.quantity || 0,
        unit_cost: i.unit_cost || 0,
        location_id,
      }))
      return await api.post(`/purchase-orders/${po_id}/receive`, { items: formattedItems })
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