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

export type PurchaseOrderFormValues = z.output<typeof purchaseOrderSchema>
export type PurchaseOrderFormInput = z.input<typeof purchaseOrderSchema>
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

export type SalesOrderFormValues = z.output<typeof salesOrderSchema>
export type SalesOrderFormInput = z.input<typeof salesOrderSchema>

export const adjustmentSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  inventory_item_id: z.coerce.number().optional(),
  location_id: z.string().min(1, 'Location is required'),
  quantity_delta: z.coerce.number().int().refine((v) => v !== 0, 'Quantity change cannot be zero'),
  reason: z.enum(['manual_add', 'manual_remove', 'cycle_count', 'write_off', 'other']),
  notes: z.string().optional(),
})

export type AdjustmentFormValues = z.infer<typeof adjustmentSchema>

// ------------------------------------------------------------
// Database entity types (rows returned from Supabase queries).
// These mirror the underlying tables/RPCs and are distinct from
// the *FormValues types above, which describe form input shapes.
// ------------------------------------------------------------

export type PurchaseOrderStatus = 'draft' | 'ordered' | 'received' | 'cancelled'
export type SalesOrderStatus = 'draft' | 'confirmed' | 'shipped' | 'cancelled'
export type AdjustmentReason = 'manual_add' | 'manual_remove' | 'cycle_count' | 'write_off' | 'other'

export interface PurchaseOrder {
  id: string
  po_number: string
  supplier_id: string | null
  status: PurchaseOrderStatus
  notes: string | null
  created_by: string | null
  created_at: string
}

export interface PurchaseOrderItem {
  id: string
  po_id: string
  sku: string
  inventory_item_id: number | null
  quantity_ordered: number
  quantity_received: number
  unit_cost: number | null
  currency: string | null
}

export interface SalesOrder {
  id: string
  so_number: string
  status: SalesOrderStatus
  notes: string | null
  created_by: string | null
  created_at: string
}

export interface SalesOrderItem {
  id: string
  so_id: string
  sku: string
  inventory_item_id: number | null
  quantity_ordered: number
  quantity_shipped: number
  unit_price: number | null
  currency: string | null
}

export interface InventoryBatch {
  id: string
  sku: string
  inventory_item_id: number | null
  batch_code: string
  expiry_date: string | null
  received_date: string
}

export interface InventoryAdjustment {
  id: string
  adjustment_number: string
  status: string
  inventory_item_id: number | null
  sku: string
  location_id: string
  quantity_delta: number
  reason: AdjustmentReason
  notes: string | null
  created_by: string | null
  created_at: string
}

export interface AuditEvent {
  id: string
  event_type: string
  entity_type: string | null
  entity_id: string | null
  sku: string | null
  quantity_delta: number | null
  unit_cost: number | null
  actor_user_email: string | null
  created_at: string
}

export interface ValuationRun {
  id: string
  costing_method: string
  started_at: string
  finished_at: string | null
  notes: string | null
}