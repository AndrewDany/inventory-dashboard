import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '../lib/apiClient'
import type { ReturnRecord } from '../types/returns'
import type { ReturnFormValues } from '../lib/returnSchema'

export function useReturns() {
  return useQuery({
    queryKey: ['returns'],
    queryFn: async (): Promise<ReturnRecord[]> => {
      const data = await api.get<ReturnRecord[]>('/returns')
      return data || []
    },
  })
}

export function useCreateReturn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: ReturnFormValues) => {
      await api.post<ReturnRecord>('/returns', values)
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
      return await api.post(`/returns/${returnId}/process`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] })
      queryClient.invalidateQueries({ queryKey: ['inventory_items'] })
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] })
      queryClient.invalidateQueries({ queryKey: ['inventory_batches'] })
      queryClient.invalidateQueries({ queryKey: ['audit_events'] })
      queryClient.invalidateQueries({ queryKey: ['monthly_financials'] })
      queryClient.invalidateQueries({ queryKey: ['profit_loss'] })
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
      return await api.post(`/returns/${returnId}/cancel`)
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