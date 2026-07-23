import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '../lib/supabaseClient'
import type { Expense } from '../types/expense'
import type { ExpenseFormValues } from '../lib/expenseSchema'

export function useExpenses(limit = 100) {
  return useQuery({
    queryKey: ['expenses', limit],
    queryFn: async (): Promise<Expense[]> => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false })
        .limit(limit)

      if (error) throw new Error(error.message)
      return data as Expense[]
    },
  })
}

export function useAddExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: ExpenseFormValues) => {
      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData.session?.user.id
      if (!userId) throw new Error('Not authenticated')

      const { error } = await supabase.from('expenses').insert({
        label: values.label,
        category: values.category,
        amount: values.amount,
        expense_date: values.expense_date,
        notes: values.notes || null,
        location_id: values.location_id || null,
        created_by: userId,
      })
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['profit_loss'] })
      toast.success('Expense added')
    },
    onError: (error: Error) => {
      toast.error(`Failed to add expense: ${error.message}`)
    },
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['profit_loss'] })
      toast.success('Expense removed')
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove expense: ${error.message}`)
    },
  })
}