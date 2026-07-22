import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'

export interface MonthlyFinancial {
  month: string // YYYY-MM
  grossSales: number
  acquisitionCost: number
}

export function useMonthlyFinancials() {
  return useQuery({
    queryKey: ['monthly_financials'],
    queryFn: async (): Promise<MonthlyFinancial[]> => {
      // 1. Fetch all sales orders with their items for this year
      const yearStart = new Date()
      yearStart.setMonth(yearStart.getMonth() - 11) // last 12 months
      yearStart.setDate(1)
      yearStart.setHours(0, 0, 0, 0)
      const startISO = yearStart.toISOString()

      const [salesRes, purchaseRes] = await Promise.all([
        supabase
          .from('sales_orders')
          .select('created_at, sales_order_items(quantity_ordered, unit_price)')
          .gte('created_at', startISO)
          .order('created_at', { ascending: true }),
        supabase
          .from('purchase_orders')
          .select('created_at, purchase_order_items(quantity_ordered, unit_cost)')
          .gte('created_at', startISO)
          .order('created_at', { ascending: true }),
      ])

      if (salesRes.error) throw new Error(salesRes.error.message)
      if (purchaseRes.error) throw new Error(purchaseRes.error.message)

      // 2. Compute monthly aggregates
      const monthlyMap = new Map<string, { grossSales: number; acquisitionCost: number }>()

      // Helper to get YYYY-MM from ISO date
      const monthKey = (iso: string) => iso.slice(0, 7)

      // Seed all 12 months
      for (let i = 0; i < 12; i++) {
        const d = new Date()
        d.setMonth(d.getMonth() - i)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        monthlyMap.set(key, { grossSales: 0, acquisitionCost: 0 })
      }

      // Aggregate sales (gross revenue)
      for (const so of salesRes.data ?? []) {
        const key = monthKey(so.created_at)
        const items = (so as any).sales_order_items ?? []
        const total = items.reduce(
          (sum: number, item: any) => sum + (item.quantity_ordered ?? 0) * (item.unit_price ?? 0),
          0
        )
        const entry = monthlyMap.get(key)
        if (entry) {
          entry.grossSales += total
        } else {
          monthlyMap.set(key, { grossSales: total, acquisitionCost: 0 })
        }
      }

      // Aggregate purchase costs (acquisition)
      for (const po of purchaseRes.data ?? []) {
        const key = monthKey(po.created_at)
        const items = (po as any).purchase_order_items ?? []
        const total = items.reduce(
          (sum: number, item: any) => sum + (item.quantity_ordered ?? 0) * (item.unit_cost ?? 0),
          0
        )
        const entry = monthlyMap.get(key)
        if (entry) {
          entry.acquisitionCost += total
        } else {
          monthlyMap.set(key, { grossSales: 0, acquisitionCost: total })
        }
      }

      // 3. Convert to sorted array
      const result: MonthlyFinancial[] = Array.from(monthlyMap.entries())
        .map(([month, data]) => ({
          month,
          grossSales: data.grossSales,
          acquisitionCost: data.acquisitionCost,
        }))
        .sort((a, b) => a.month.localeCompare(b.month))

      return result
    },
    staleTime: 60_000, // 1 minute
  })
}
