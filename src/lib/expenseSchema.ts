import { z } from 'zod'

export const expenseSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  category: z.enum(['rent', 'salaries', 'utilities', 'transport', 'equipment', 'maintenance', 'marketing', 'other']),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  expense_date: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
  location_id: z.string().optional(),
})

export type ExpenseFormValues = z.infer<typeof expenseSchema>