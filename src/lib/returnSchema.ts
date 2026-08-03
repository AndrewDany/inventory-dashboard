import { z } from 'zod'

export const returnSchema = z.object({
  return_type: z.enum(['customer_return', 'damaged_stock', 'supplier_return']),
  sku: z.string().min(1, 'SKU is required'),
  inventory_item_id: z.coerce.number().optional(),
  location_id: z.string().min(1, 'Location is required'),
  quantity: z.coerce.number().min(0.001, 'Quantity must be greater than 0'),
  unit_cost: z.coerce.number().min(0).optional(),
  reason: z.enum(['damaged', 'defective', 'wrong_item', 'expired', 'other']),
  resolution: z.enum(['replace', 'refund', 'restock', 'write_off', 'supplier_credit']),
  supplier_id: z.string().optional(),
  customer_name: z.string().optional(),
  notes: z.string().optional(),
})

export type ReturnFormValues = z.infer<typeof returnSchema>