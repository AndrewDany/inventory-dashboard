import { z } from 'zod'

export const inventoryItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  category: z.string().optional(),
  quantity: z.coerce.number().min(0, 'Quantity cannot be negative'),
  reorder_level: z.coerce.number().min(0, 'Reorder level cannot be negative'),
  unit_price: z.coerce.number().min(0, 'Price cannot be negative').optional(),
  supplier: z.string().optional(),
  location_id: z.string().optional(),
  unit_of_measure: z.string().min(1, 'Unit is required'),
  sale_mode: z.enum(['unit', 'weight']),
})

export type InventoryFormValues = z.infer<typeof inventoryItemSchema>