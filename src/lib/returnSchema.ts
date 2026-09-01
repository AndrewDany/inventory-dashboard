import { z } from 'zod'

const baseReturnSchema = z.object({
  return_type: z.enum(['customer_return', 'damaged_stock', 'supplier_return']),
  sku: z.string().min(1, 'SKU is required'),
  inventory_item_id: z.coerce.number().optional(),
  location_id: z.string().min(1, 'Location is required'),
  quantity: z.coerce.number().min(0.001, 'Quantity must be greater than 0'),
  unit_cost: z.coerce.number().min(0).optional(),
  refund_amount: z.coerce.number().min(0).optional(),
  reason: z.enum(['damaged', 'defective', 'wrong_item', 'expired', 'other']),
  resolution: z.enum(['replace', 'refund', 'restock', 'write_off', 'supplier_credit']),
  supplier_id: z.string().optional(),
  customer_name: z.string().optional(),
  notes: z.string().optional(),
})

export const returnSchema = baseReturnSchema.superRefine((data, ctx) => {
  if (data.return_type === 'customer_return' && !data.customer_name?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Customer name is required for customer returns',
      path: ['customer_name'],
    })
  }
  if (data.return_type === 'supplier_return' && !data.supplier_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Supplier is required for supplier returns',
      path: ['supplier_id'],
    })
  }
  if (data.resolution === 'refund' && !(data.refund_amount && data.refund_amount > 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Refund amount is required so it can be deducted from revenue',
      path: ['refund_amount'],
    })
  }
})

export type ReturnFormValues = z.infer<typeof baseReturnSchema>