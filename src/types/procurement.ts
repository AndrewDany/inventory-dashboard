// src/types/procurement.ts
// ------------------------------------------------------------
export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string | null;
  status: 'draft' | 'ordered' | 'received' | 'cancelled';
  received_at: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  po_id: string;
  inventory_item_id: number | null;
  sku: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number | null;
  currency: string | null;
  created_at: string;
}

export interface SalesOrder {
  id: string;
  so_number: string;
  status: 'draft' | 'confirmed' | 'shipped' | 'cancelled';
  shipped_at: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
}

export interface SalesOrderItem {
  id: string;
  so_id: string;
  inventory_item_id: number | null;
  sku: string;
  quantity_ordered: number;
  quantity_shipped: number;
  unit_price: number | null;
  currency: string | null;
  created_at: string;
}

export interface InventoryBatch {
  id: string;
  sku: string;
  batch_code: string;
  expiry_date: string | null;
  received_date: string;
  supplier_id: string | null;
  unit_cost: number | null;
  currency: string | null;
  created_at: string;
}

export interface InventoryAdjustment {
  id: string;
  adjustment_number: string;
  reason: 'manual_add' | 'manual_remove' | 'cycle_count' | 'write_off' | 'other';
  notes: string | null;
  status: string;
  created_by: string;
  created_at: string;
}

export interface AuditEvent {
  id: string;
  event_type: string;
  entity_type: string | null;
  entity_id: string | null;
  sku: string | null;
  batch_id: string | null;
  location_id: string | null;
  quantity_delta: number | null;
  unit_cost: number | null;
  actor_user_id: string | null;
  actor_user_email: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ValuationRun {
  id: string;
  costing_method: 'avg';
  started_at: string;
  finished_at: string | null;
  notes: string | null;
  created_by: string;
}
