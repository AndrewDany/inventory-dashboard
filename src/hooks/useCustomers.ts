import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '../lib/apiClient'

export interface CustomerAccount {
  id: string
  full_name: string
  phone: string
  email: string | null
  delivery_address: string | null
  credit_limit: number
  outstanding_balance: number
  first_purchase_at: string | null
  last_purchase_at: string | null
}

export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get<CustomerAccount[]>('/customers'),
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { full_name: string; phone: string; email?: string }) =>
      api.post('/customers', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Customer added')
    },
    onError: (error: Error) => toast.error(`Unable to add customer: ${error.message}`),
  })
}

export function useUpdateCreditLimit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ customerId, creditLimit }: { customerId: string; creditLimit: number }) =>
      api.put(`/customers/${customerId}/credit-limit`, { credit_limit: creditLimit }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Credit limit updated')
    },
    onError: (error: Error) => toast.error(`Unable to update credit limit: ${error.message}`),
  })
}
