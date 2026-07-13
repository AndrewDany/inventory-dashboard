import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '../lib/supabaseClient'
import type { Supplier } from '../types/supplier'
import type { SupplierFormValues } from '../lib/supplierSchema'

export function useSuppliers() {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async (): Promise<Supplier[]> => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw new Error(error.message)
      return data as Supplier[]
    },
  })
}

export function useAddSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: SupplierFormValues) => {
      const { error } = await supabase.from('suppliers').insert([values])
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success('Supplier added')
    },
    onError: (error) => {
      toast.error(`Failed to add supplier: ${error.message}`)
    },
  })
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: SupplierFormValues }) => {
      const { error } = await supabase.from('suppliers').update(values).eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success('Supplier updated')
    },
    onError: (error) => {
      toast.error(`Failed to update supplier: ${error.message}`)
    },
  })
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('suppliers').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success('Supplier deleted')
    },
    onError: (error) => {
      toast.error(`Failed to delete supplier: ${error.message}`)
    },
  })
}