import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './useAuth'
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
      const rows = (data ?? []) as Expense[]
      return rows.map((expense) => ({
        ...expense,
        amount: Number(expense.amount ?? 0),
      })) as Expense[]
    },
  })
}

export function useAddExpense() {
  const { session } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: ExpenseFormValues) => {
      const { data: sessionData } = await supabase.auth.getSession()
      const userId = session?.user?.id ?? sessionData.session?.user?.id
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
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'expenses' })
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'profit_loss' })
      toast.success('Expense added')
    },
    onError: (error: Error) => {
      console.error('Expense add failed', error)
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
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'expenses' })
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'profit_loss' })
      toast.success('Expense removed')
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove expense: ${error.message}`)
    },
  })
}

export function useExpensesInRange(start: string, end: string) {
  return useQuery({
    queryKey: ['expenses', start, end],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('amount, category, expense_date')
        .gte('expense_date', start)
        .lte('expense_date', end)

      if (error) throw new Error(error.message)
      return data as Expense[]
    },
  })
}