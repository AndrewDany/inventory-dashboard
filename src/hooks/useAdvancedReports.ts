import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'

export interface ValuationTrend {
  month: string
  totalValue: number
  totalUnits: number
}

export interface TopMover {
  sku: string
  name: string
  totalSold: number
  totalRevenue: number
  category: string | null
}

export interface SupplierPerformance {
  supplierName: string
  totalPOs: number
  completedPOs: number
  onTimeRate: number
  totalSpent: number
}

export function useValuationTrends() {
  return useQuery({
    queryKey: ['valuation_trends'],
    queryFn: async (): Promise<ValuationTrend[]> => {
      const { data, error } = await supabase
        .from('valuation_runs')
        .select('started_at, finished_at, valuation_run_items!inner(on_hand_quantity, total_value)')
        .order('started_at', { ascending: true })
        .limit(12)

      if (error) throw new Error(error.message)

      const trends: ValuationTrend[] = (data ?? []).map((run: Record<string, unknown>) => {
        const items = run.valuation_run_items as Array<Record<string, unknown>>
        return {
          month: new Date(run.started_at as string).toISOString().slice(0, 7),
          totalValue: items.reduce((sum: number, i: Record<string, unknown>) => sum + Number(i.total_value ?? 0), 0),
          totalUnits: items.reduce((sum: number, i: Record<string, unknown>) => sum + Number(i.on_hand_quantity ?? 0), 0),
        }
      })

      return trends
    },
    staleTime: 60_000,
  })
}

export function useTopMovers() {
  return useQuery({
    queryKey: ['top_movers'],
    queryFn: async (): Promise<TopMover[]> => {
      const { data, error } = await supabase
        .from('sales_order_items')
        .select('sku, quantity_shipped, unit_price, sales_orders!inner(created_at)')
        .gte('sales_orders.created_at', new Date(Date.now() - 90 * 86400000).toISOString())
        .gt('quantity_shipped', 0)

      if (error) throw new Error(error.message)

      const bySku = new Map<string, { totalSold: number; totalRevenue: number }>()
      for (const item of data ?? []) {
        const r = item as Record<string, unknown>
        const sku = r.sku as string
        const qty = Number(r.quantity_shipped ?? 0)
        const price = Number(r.unit_price ?? 0)
        const existing = bySku.get(sku) ?? { totalSold: 0, totalRevenue: 0 }
        existing.totalSold += qty
        existing.totalRevenue += qty * price
        bySku.set(sku, existing)
      }

      const { data: inventoryItems } = await supabase
        .from('inventory_items')
        .select('sku, name, category')

      const nameMap = new Map<string, { name: string; category: string | null }>()
      for (const item of inventoryItems ?? []) {
        const r = item as Record<string, unknown>
        nameMap.set(r.sku as string, {
          name: r.name as string,
          category: r.category as string | null,
        })
      }

      return Array.from(bySku.entries())
        .map(([sku, stats]) => {
          const info = nameMap.get(sku)
          return {
            sku,
            name: info?.name ?? sku,
            category: info?.category ?? null,
            totalSold: stats.totalSold,
            totalRevenue: stats.totalRevenue,
          }
        })
        .sort((a: TopMover, b: TopMover) => b.totalSold - a.totalSold)
        .slice(0, 20)
    },
    staleTime: 60_000,
  })
}

export function useSupplierPerformance() {
  return useQuery({
    queryKey: ['supplier_performance'],
    queryFn: async (): Promise<SupplierPerformance[]> => {
      const { data: suppliers } = await supabase
        .from('suppliers')
        .select('id, name')

      if (!suppliers) return []

      const { data: orders } = await supabase
        .from('purchase_orders')
        .select('supplier_id, status, created_at')
        .not('supplier_id', 'is', null)

      const bySupplier = new Map<string, { total: number; completed: number }>()
      for (const order of orders ?? []) {
        const r = order as Record<string, unknown>
        const sid = r.supplier_id as string
        const status = r.status as string
        const entry = bySupplier.get(sid) ?? { total: 0, completed: 0 }
        entry.total++
        if (status === 'received') entry.completed++
        bySupplier.set(sid, entry)
      }

      return suppliers
        .map((s: Record<string, unknown>) => {
          const stats = bySupplier.get(s.id as string)
          return {
            supplierName: s.name as string,
            totalPOs: stats?.total ?? 0,
            completedPOs: stats?.completed ?? 0,
            onTimeRate: stats && stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
            totalSpent: 0,
          }
        })
        .filter((s: SupplierPerformance) => s.totalPOs > 0)
        .sort((a: SupplierPerformance, b: SupplierPerformance) => b.totalPOs - a.totalPOs)
    },
    staleTime: 60_000,
  })
}
