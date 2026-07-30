import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '../lib/supabaseClient'
import type { CSVImportRow } from '../lib/importInventory'

const BATCH_SIZE = 500

export function useBulkImportItems() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (rows: CSVImportRow[]): Promise<{ inserted: number }> => {
      let inserted = 0

      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE)
        const { error } = await supabase.from('inventory_items').insert(batch)
        if (error) throw new Error(error.message)
        inserted += batch.length
      }

      return { inserted }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['inventory_items'] })
      toast.success(`${result.inserted} items imported successfully`)
    },
    onError: (error: Error) => {
      toast.error(`Import failed: ${error.message}`)
    },
  })
}

