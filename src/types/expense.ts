export interface Expense {
  id: string
  label: string
  category: 'rent' | 'salaries' | 'utilities' | 'transport' | 'equipment' | 'maintenance' | 'marketing' | 'other'
  amount: number
  expense_date: string
  notes: string | null
  location_id: string | null
  created_by: string
  created_at: string
}

export const EXPENSE_CATEGORIES: { value: Expense['category']; label: string }[] = [
  { value: 'rent', label: 'Rent' },
  { value: 'salaries', label: 'Salaries & Wages' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'transport', label: 'Transport & Delivery' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'other', label: 'Other' },
]