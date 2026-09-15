import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '../lib/apiClient'
import type { Expense } from '../types/expense'
import type { ExpenseFormValues } from '../lib/expenseSchema'

export function useExpenses(limit = 100) {
  return useQuery({
    queryKey: ['expenses', limit],
    queryFn: async (): Promise<Expense[]> => {
      const data = await api.get<any[]>('/expenses')
      return (data || []).map((e) => ({
        id: e.id,
        label: e.description || e.label || 'Expense',
        category: e.category,
        amount: Number(e.amount || 0),
        expense_date: e.date || e.expense_date,
        notes: e.notes || null,
        location_id: e.location_id || null,
        created_by: e.created_by,
        created_at: e.created_at,
      })) as Expense[]
    },
  })
}

export function useAddExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: ExpenseFormValues) => {
      await api.post('/expenses', {
        date: values.expense_date,
        category: values.category,
        description: values.label,
        amount: values.amount,
        notes: values.notes,
        location_id: values.location_id,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['profit_loss'] })
      queryClient.invalidateQueries({ queryKey: ['budget'] })
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
      await api.delete(`/expenses/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['profit_loss'] })
      queryClient.invalidateQueries({ queryKey: ['budget'] })
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
    queryFn: async (): Promise<Expense[]> => {
      const data = await api.get<any[]>('/expenses')
      return (data || [])
        .filter((e) => (e.date || e.expense_date) >= start && (e.date || e.expense_date) <= end)
        .map((e) => ({
          id: e.id,
          label: e.description || e.label || 'Expense',
          category: e.category,
          amount: Number(e.amount || 0),
          expense_date: e.date || e.expense_date,
          notes: e.notes || null,
          location_id: e.location_id || null,
          created_by: e.created_by,
          created_at: e.created_at,
        })) as Expense[]
    },
  })
}