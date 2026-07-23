import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { expenseSchema, type ExpenseFormValues } from '../../lib/expenseSchema'
import { useAddExpense } from '../../hooks/useExpenses'
import { EXPENSE_CATEGORIES } from '../../types/expense'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function ExpenseForm({ onClose }: { onClose: () => void }) {
  const addExpense = useAddExpense()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: 'other',
      expense_date: new Date().toISOString().slice(0, 10),
    },
  })

  const category = watch('category')

  async function onSubmit(values: ExpenseFormValues) {
    await addExpense.mutateAsync(values)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="label" className="mb-1 block">Expense Label</Label>
        <Input id="label" {...register('label')} placeholder="e.g. Cement delivery truck rental" />
        {errors.label && <p className="text-red-600 text-sm mt-1">{errors.label.message}</p>}
      </div>

      <div>
        <Label className="mb-1 block">Category</Label>
        <Select value={category} onValueChange={(v) => setValue('category', v as ExpenseFormValues['category'])}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EXPENSE_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="amount" className="mb-1 block">Amount (GHS)</Label>
          <Input id="amount" type="number" step="0.01" {...register('amount')} />
          {errors.amount && <p className="text-red-600 text-sm mt-1">{errors.amount.message}</p>}
        </div>
        <div>
          <Label htmlFor="expense_date" className="mb-1 block">Date</Label>
          <Input id="expense_date" type="date" {...register('expense_date')} />
        </div>
      </div>

      <div>
        <Label htmlFor="notes" className="mb-1 block">Notes (optional)</Label>
        <Input id="notes" {...register('notes')} />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Adding...' : 'Add Expense'}
        </Button>
      </div>
    </form>
  )
}