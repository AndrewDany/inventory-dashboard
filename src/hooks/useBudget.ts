import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '../lib/apiClient'

export interface BudgetSummary {
  monthlyBudget: number
  spentThisMonth: number
  remaining: number
}

export function useBudget() {
  return useQuery({
    queryKey: ['budget_summary'],
    queryFn: async (): Promise<BudgetSummary> => {
      const data = await api.get<any>('/financials/budget')
      return {
        monthlyBudget: Number(data.monthlyBudget || 0),
        spentThisMonth: Number(data.spentThisMonth || 0),
        remaining: Number(data.remaining || 0),
      }
    },
  })
}

export function useUpdateBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (value: number) => {
      await api.put('/financials/budget', { monthly_budget: value })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget_summary'] })
      toast.success('Budget updated')
    },
    onError: (error: Error) => {
      toast.error(`Failed to update budget: ${error.message}`)
    },
  })
}