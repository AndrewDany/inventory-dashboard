import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'

export interface MonthlyFinancial {
  month: string // YYYY-MM
  grossSales: number
  cogs: number
  grossProfit: number
  expenses: number
  netProfit: number
}

function monthKey(dateStr: string) {
  return dateStr.slice(0, 7)
}

export function useMonthlyFinancials() {
  return useQuery({
    queryKey: ['monthly_financials'],
    queryFn: async (): Promise<MonthlyFinancial[]> => {
      // Include the full sales history so older shipped goods continue to affect gross profit.
      // The chart display can still trim to the latest 12 months when needed.

      // Revenue: shipped sales order items
      const { data: soItems, error: soError } = await supabase
        .from('sales_order_items')
        .select('quantity_shipped, unit_price, sales_orders!inner(created_at)')

      if (soError) throw new Error(soError.message)

      // COGS: negative stock movements (goods going out), with their cost at time of movement.
      // If a legacy row has a missing/zero unit_cost, fall back to the most recent batch cost for that SKU.
      const { data: movements, error: movError } = await supabase
        .from('stock_movements')
        .select('item_name, change_amount, unit_cost, created_at')
        .lt('change_amount', 0)

      if (movError) throw new Error(movError.message)

      const { data: batchCosts, error: batchCostError } = await supabase
        .from('inventory_batches')
        .select('sku, unit_cost, received_date, created_at')

      if (batchCostError) throw new Error(batchCostError.message)

      const latestBatchCostBySku = new Map<string, number>()
      for (const batch of batchCosts ?? []) {
        const sku = String(batch.sku ?? '')
        if (!sku) continue
        const cost = Number(batch.unit_cost ?? 0)
        const key = batch.received_date ?? batch.created_at ?? ''
        const current = latestBatchCostBySku.get(sku)
        if (!current || (key && (!latestBatchCostBySku.get(`${sku}__date`) || key > latestBatchCostBySku.get(`${sku}__date`)!))) {
          latestBatchCostBySku.set(sku, cost)
          if (key) latestBatchCostBySku.set(`${sku}__date`, key)
        }
      }

      // Operating expenses
      const { data: expenses, error: expError } = await supabase
        .from('expenses')
        .select('amount, expense_date')

      if (expError) throw new Error(expError.message)

      const months = new Map<string, MonthlyFinancial>()

      const ensure = (key: string) => {
        if (!months.has(key)) {
          months.set(key, { month: key, grossSales: 0, cogs: 0, grossProfit: 0, expenses: 0, netProfit: 0 })
        }
        return months.get(key)!
      }

      for (const item of soItems ?? []) {
        const key = monthKey(item.sales_orders.created_at)
        const quantity = Number(item.quantity_shipped ?? 0)
        const unitPrice = Number(item.unit_price ?? 0)
        ensure(key).grossSales += quantity * unitPrice
      }

      for (const m of movements ?? []) {
        const key = monthKey(m.created_at)
        const changeAmount = Number(m.change_amount ?? 0)
        const movementCost = Number(m.unit_cost ?? 0)
        const sku = String(m.item_name ?? '')
        const batchFallbackCost = sku ? Number(latestBatchCostBySku.get(sku) ?? 0) : 0
        const unitCost = movementCost > 0 ? movementCost : batchFallbackCost
        ensure(key).cogs += Math.abs(changeAmount) * unitCost
      }

      for (const e of expenses ?? []) {
        const key = monthKey(e.expense_date)
        const amount = Number(e.amount ?? 0)
        ensure(key).expenses += amount
      }

      const result = Array.from(months.values())
        .map((m) => ({
          ...m,
          grossProfit: m.grossSales - m.cogs,
          netProfit: m.grossSales - m.cogs - m.expenses,
        }))
        .sort((a, b) => a.month.localeCompare(b.month))

      return result
    },
  })
}