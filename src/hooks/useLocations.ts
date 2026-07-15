import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '../lib/supabaseClient'
import type { Location } from '../types/location'
import type { LocationFormValues } from '../lib/locationSchema'

export function useLocations() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: async (): Promise<Location[]> => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw new Error(error.message)
      return data as Location[]
    },
  })
}

export function useAddLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: LocationFormValues) => {
      const { error } = await supabase.from('locations').insert([values])
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] })
      toast.success('Location added')
    },
    onError: (error) => {
      toast.error(`Failed to add location: ${error.message}`)
    },
  })
}

export function useUpdateLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: LocationFormValues }) => {
      const { error } = await supabase.from('locations').update(values).eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] })
      toast.success('Location updated')
    },
    onError: (error) => {
      toast.error(`Failed to update location: ${error.message}`)
    },
  })
}

export function useDeleteLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('locations').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] })
      toast.success('Location deleted')
    },
    onError: (error) => {
      toast.error(`Failed to delete location: ${error.message}`)
    },
  })
}