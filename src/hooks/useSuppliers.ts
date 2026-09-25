import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '../lib/apiClient'
import type { Supplier } from '../types/supplier'
import type { SupplierFormValues } from '../lib/supplierSchema'

export function useSuppliers() {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async (): Promise<Supplier[]> => {
      const data = await api.get<Supplier[]>('/suppliers')
      return data || []
    },
  })
}

export function useAddSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: SupplierFormValues) => {
      await api.post<Supplier>('/suppliers', values)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success('Supplier added')
    },
    onError: (error: Error) => {
      toast.error(`Failed to add supplier: ${error.message}`)
    },
  })
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: SupplierFormValues }) => {
      await api.put<Supplier>(`/suppliers/${id}`, values)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success('Supplier updated')
    },
    onError: (error: Error) => {
      toast.error(`Failed to update supplier: ${error.message}`)
    },
  })
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/suppliers/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success('Supplier deleted')
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete supplier: ${error.message}`)
    },
  })
}