import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '../lib/apiClient'
import type { CSVImportRow } from '../lib/importInventory'

export function useBulkImportItems() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (rows: CSVImportRow[]): Promise<{ inserted: number }> => {
      const res = await api.post<{ imported: number }>('/inventory/bulk', { items: rows })
      return { inserted: res?.imported ?? rows.length }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['inventory_items'] })
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] })
      toast.success(`${result.inserted} items imported successfully`)
    },
    onError: (error: Error) => {
      toast.error(`Import failed: ${error.message}`)
    },
  })
}
