import { z } from 'zod'

export const locationSchema = z.object({
  name: z.string().min(1, 'Location name is required'),
  address: z.string().optional(),
})

export type LocationFormValues = z.infer<typeof locationSchema>