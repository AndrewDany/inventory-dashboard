import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '../lib/supabaseClient'
import type { ReturnRecord } from '../types/returns'
import type { ReturnFormValues } from '../lib/returnSchema'

export function useReturns() {
  return useQuery({
    queryKey: ['returns'],
    queryFn: async (): Promise<ReturnRecord[]> => {
      const { data, error } = await supabase
        .from('returns')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw new Error(error.message)
      return data as ReturnRecord[]
    },
  })
}

export function useCreateReturn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: ReturnFormValues) => {
      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData.session?.user.id
      if (!userId) throw new Error('Not authenticated')

      const returnNumber = `RET-${Date.now().toString().slice(-8)}`

      const { error } = await supabase.from('returns').insert({
        return_number: returnNumber,
        return_type: values.return_type,
        inventory_item_id: values.inventory_item_id ?? null,
        sku: values.sku,
        location_id: values.location_id,
        quantity: values.quantity,
        unit_cost: values.unit_cost ?? null,
        refund_amount: values.refund_amount ?? null,
        reason: values.reason,
        resolution: values.resolution,
        supplier_id: values.supplier_id ?? null,
        customer_name: values.customer_name ?? null,
        notes: values.notes ?? null,
        created_by: userId,
      })

      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] })
      toast.success('Return logged — process it to apply stock changes')
    },
    onError: (error: Error) => {
      toast.error(`Failed to log return: ${error.message}`)
    },
  })
}

export function useProcessReturn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (returnId: string) => {
      const { data, error } = await supabase.rpc('process_return', { p_return_id: returnId })
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] })
      queryClient.invalidateQueries({ queryKey: ['inventory_items'] })
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] })
      queryClient.invalidateQueries({ queryKey: ['inventory_batches'] })
      queryClient.invalidateQueries({ queryKey: ['inventory_batch_stock'] })
      queryClient.invalidateQueries({ queryKey: ['audit_events'] })
      queryClient.invalidateQueries({ queryKey: ['monthly_financials'] })
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'profit_loss' })
      toast.success('Return processed — stock updated')
    },
    onError: (error: Error) => {
      toast.error(`Failed to process return: ${error.message}`)
    },
  })
}

export function useCancelReturn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (returnId: string) => {
      const { data, error } = await supabase.rpc('cancel_return', { p_return_id: returnId })
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] })
      queryClient.invalidateQueries({ queryKey: ['audit_events'] })
      toast.success('Return cancelled')
    },
    onError: (error: Error) => {
      toast.error(`Failed to cancel return: ${error.message}`)
    },
  })
}