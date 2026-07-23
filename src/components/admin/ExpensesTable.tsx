import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useExpenses, useDeleteExpense } from '../../hooks/useExpenses'
import { EXPENSE_CATEGORIES } from '../../types/expense'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Modal from '../ui/Modal'
import ExpenseForm from './ExpenseForm'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function ExpensesTable() {
  const { data: expenses, isLoading, error } = useExpenses()
  const deleteExpense = useDeleteExpense()
  const [showForm, setShowForm] = useState(false)

  const categoryLabel = (value: string) =>
    EXPENSE_CATEGORIES.find((c) => c.value === value)?.label ?? value

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus size={14} className="mr-1" /> Add Expense
        </Button>
      </div>

      {isLoading && <p className="text-gray-500 text-sm">Loading expenses...</p>}
      {error && <p className="text-red-600 text-sm">Error: {error.message}</p>}
      {expenses && expenses.length === 0 && (
        <p className="text-gray-500 text-sm">No expenses recorded yet.</p>
      )}

      {expenses && expenses.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">{expense.label}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{categoryLabel(expense.category)}</Badge>
                </TableCell>
                <TableCell className="text-gray-500">
                  {new Date(expense.expense_date).toLocaleDateString()}
                </TableCell>
                <TableCell className="font-medium">GHS {expense.amount.toFixed(2)}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => deleteExpense.mutate(expense.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {showForm && (
        <Modal title="Add Expense" onClose={() => setShowForm(false)}>
          <ExpenseForm onClose={() => setShowForm(false)} />
        </Modal>
      )}
    </div>
  )
}