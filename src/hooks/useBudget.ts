import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '../lib/supabaseClient'

export interface BudgetSummary {
  monthlyBudget: number
  spentThisMonth: number
  remaining: number
}

function currentMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  return start
}

export function useBudget() {
  return useQuery({
    queryKey: ['budget_summary'],
    queryFn: async (): Promise<BudgetSummary> => {
      const { data: setting } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'monthly_budget')
        .single()

      const monthlyBudget = Number(setting?.value ?? 0)
      const start = currentMonthRange()

      // Spend this month = cost of everything actually received into stock
      const { data: movements, error } = await supabase
        .from('stock_movements')
        .select('change_amount, unit_cost, created_at')
        .gt('change_amount', 0)
        .gte('created_at', start)

      if (error) throw new Error(error.message)

      const spentThisMonth = (movements ?? []).reduce(
        (sum, m) => sum + m.change_amount * (m.unit_cost ?? 0),
        0
      )

      return {
        monthlyBudget,
        spentThisMonth,
        remaining: Math.max(monthlyBudget - spentThisMonth, 0),
      }
    },
  })
}

export function useUpdateBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (value: number) => {
      const { error } = await supabase
        .from('settings')
        .upsert({ key: 'monthly_budget', value: String(value) }, { onConflict: 'key' })
      if (error) throw new Error(error.message)
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