import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '../lib/apiClient'
import type { SalesOrder, SalesOrderItem } from '../types/procurement'

export interface SalesOrderWithItems extends SalesOrder {
  sales_order_items: SalesOrderItem[]
}

export function useSalesOrders() {
  return useQuery({
    queryKey: ['sales_orders'],
    queryFn: async (): Promise<SalesOrderWithItems[]> => {
      const data = await api.get<any[]>('/sales-orders')
      return (data || []).map((so) => ({
        ...so,
        sales_order_items: so.items || so.sales_order_items || [],
      }))
    },
  })
}

interface CreateSOInput {
  so_number: string
  notes?: string
  customer_name?: string
  customer_phone?: string
  is_preorder?: boolean
  fulfillment_method?: 'pickup' | 'delivery'
  delivery_address?: string
  deposit_amount?: number
  items: { sku: string; inventory_item_id?: string; quantity_ordered: number; unit_price?: number; currency?: string }[]
}

export function useCreateSalesOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateSOInput) => {
      return await api.post('/sales-orders', input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales_orders'] })
      queryClient.invalidateQueries({ queryKey: ['monthly_financials'] })
      queryClient.invalidateQueries({ queryKey: ['profit_loss'] })
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
  items?: { item_id?: string; sku?: string; quantity?: number }[]
}

export function useShipSalesOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ so_id, location_id }: ShipSOInput) => {
      return await api.post(`/sales-orders/${so_id}/ship`, { location_id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales_orders'] })
      queryClient.invalidateQueries({ queryKey: ['inventory_items'] })
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] })
      queryClient.invalidateQueries({ queryKey: ['inventory_batches'] })
      queryClient.invalidateQueries({ queryKey: ['monthly_financials'] })
      queryClient.invalidateQueries({ queryKey: ['profit_loss'] })
      toast.success('Sales order shipped — stock deducted')
    },
    onError: (error: Error) => {
      toast.error(`Failed to ship sales order: ${error.message}`)
    },
  })
}

/**
 * Pre-orders are regular sales orders with is_preorder = 1 -- same table,
 * same Fulfill/ship flow, same P&L reporting. This just filters the
 * already-fetched list so the Pre-Orders screen only shows those, instead
 * of every walk-in and POS sale too.
 */
export function usePreOrders() {
  const query = useSalesOrders()
  return {
    ...query,
    data: query.data?.filter((so) => Number(so.is_preorder) === 1),
  }
}

interface RecordPaymentInput {
  so_id: string
  amount: number
}

export function useRecordPreOrderPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ so_id, amount }: RecordPaymentInput) => {
      return await api.post(`/sales-orders/${so_id}/payment`, { amount })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales_orders'] })
      toast.success('Payment recorded')
    },
    onError: (error: Error) => {
      toast.error(`Failed to record payment: ${error.message}`)
    },
  })
}