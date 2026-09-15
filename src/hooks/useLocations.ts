import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '../lib/apiClient'
import type { Location } from '../types/location'
import type { LocationFormValues } from '../lib/locationSchema'

export function useLocations() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: async (): Promise<Location[]> => {
      const data = await api.get<Location[]>('/locations')
      return data || []
    },
  })
}

export function useAddLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: LocationFormValues) => {
      await api.post<Location>('/locations', values)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] })
      toast.success('Location added')
    },
    onError: (error: Error) => {
      toast.error(`Failed to add location: ${error.message}`)
    },
  })
}

export function useUpdateLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: LocationFormValues }) => {
      await api.put<Location>(`/locations/${id}`, values)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] })
      toast.success('Location updated')
    },
    onError: (error: Error) => {
      toast.error(`Failed to update location: ${error.message}`)
    },
  })
}

export function useDeleteLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/locations/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] })
      toast.success('Location deleted')
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete location: ${error.message}`)
    },
  })
}