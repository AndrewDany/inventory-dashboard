import { z } from 'zod'

export const inventoryItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  category: z.string().optional(),
  quantity: z.coerce.number().int().min(0, 'Quantity cannot be negative'),
  reorder_level: z.coerce.number().int().min(0, 'Reorder level cannot be negative'),
  unit_price: z.coerce.number().min(0, 'Price cannot be negative').optional(),
  supplier: z.string().optional(),
  location_id: z.string().optional(),
})

export type InventoryFormValues = z.infer<typeof inventoryItemSchema>