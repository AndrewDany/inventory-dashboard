import { z } from 'zod'

export const poLineItemSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  inventory_item_id: z.coerce.number().optional(),
  quantity_ordered: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  unit_cost: z.coerce.number().min(0).optional(),
})

export const purchaseOrderSchema = z.object({
  po_number: z.string().min(1, 'PO number is required'),
  supplier_id: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(poLineItemSchema).min(1, 'Add at least one line item'),
})

export type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>
export type POLineItem = z.infer<typeof poLineItemSchema>

export const soLineItemSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  inventory_item_id: z.coerce.number().optional(),
  quantity_ordered: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  unit_price: z.coerce.number().min(0).optional(),
})

export const salesOrderSchema = z.object({
  so_number: z.string().min(1, 'SO number is required'),
  notes: z.string().optional(),
  items: z.array(soLineItemSchema).min(1, 'Add at least one line item'),
})

export type SalesOrderFormValues = z.infer<typeof salesOrderSchema>

export const adjustmentSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  inventory_item_id: z.coerce.number().optional(),
  location_id: z.string().min(1, 'Location is required'),
  quantity_delta: z.coerce.number().int().refine((v) => v !== 0, 'Quantity change cannot be zero'),
  reason: z.enum(['manual_add', 'manual_remove', 'cycle_count', 'write_off', 'other']),
  notes: z.string().optional(),
})

export type AdjustmentFormValues = z.infer<typeof adjustmentSchema>