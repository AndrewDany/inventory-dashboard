import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/apiClient'

export interface PurchaseRecord {
  id: string
  item: string
  quantity: number
  unitPrice: number
  total: number
  date: string
}

export interface FinancialData {
  budget: number
  spent: number
  recentPurchases: PurchaseRecord[]
}

async function getSetting(key: string): Promise<string | null> {
  const data = await api.get<Record<string, string>>('/settings')
  return data?.[key] ?? null
}

async function upsertSetting(key: string, value: string): Promise<void> {
  await api.post('/settings', { [key]: value })
}

export function useFinancialControl() {
  return useQuery({
    queryKey: ['financial_control'],
    queryFn: async (): Promise<FinancialData> => {
      const data = await api.get<Record<string, string>>('/settings')
      const settings = data || {}

      const budgetRaw = settings['financial_budget']
      const spentRaw = settings['financial_spent']
      const purchasesRaw = settings['financial_purchases']

      const budget = Number(budgetRaw ?? 100000)
      const spent = Number(spentRaw ?? 0)

      let recentPurchases: PurchaseRecord[] = []
      if (purchasesRaw) {
        try {
          recentPurchases = JSON.parse(purchasesRaw) as PurchaseRecord[]
        } catch {
          recentPurchases = []
        }
      }

      return {
        budget: Number.isFinite(budget) && budget >= 0 ? budget : 100000,
        spent: Number.isFinite(spent) && spent >= 0 ? spent : 0,
        recentPurchases,
      }
    },
    staleTime: 30_000,
  })
}

export function useUpdateBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (budget: number) => {
      await upsertSetting('financial_budget', String(budget))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial_control'] })
    },
  })
}

export function useAddPurchase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      itemName,
      quantity,
      unitPrice,
      total,
    }: {
      itemName: string
      quantity: number
      unitPrice: number
      total: number
    }) => {
      // Get current financial data
      const spentRaw = await getSetting('financial_spent')
      const purchasesRaw = await getSetting('financial_purchases')

      const currentSpent = Number(spentRaw ?? 0)
      const newSpent = currentSpent + total

      let purchases: PurchaseRecord[] = []
      if (purchasesRaw) {
        try {
          purchases = JSON.parse(purchasesRaw) as PurchaseRecord[]
        } catch {
          purchases = []
        }
      }

      const newPurchase: PurchaseRecord = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        item: itemName,
        quantity,
        unitPrice,
        total,
        date: new Date().toLocaleString(),
      }

      purchases = [newPurchase, ...purchases].slice(0, 5)

      // Save both
      await Promise.all([
        upsertSetting('financial_spent', String(newSpent)),
        upsertSetting('financial_purchases', JSON.stringify(purchases)),
      ])
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial_control'] })
    },
  })
}
