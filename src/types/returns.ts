export interface ReturnRecord {
  id: string
  return_number: string
  return_type: 'customer_return' | 'damaged_stock' | 'supplier_return'
  inventory_item_id: number | null
  sku: string
  location_id: string
  quantity: number
  unit_cost: number | null
  refund_amount: number | null
  refund_amount_estimated: boolean
  reason: 'damaged' | 'defective' | 'wrong_item' | 'expired' | 'other'
  resolution: 'replace' | 'refund' | 'restock' | 'write_off' | 'supplier_credit'
  status: 'pending' | 'completed' | 'cancelled'
  reference_so_id: string | null
  supplier_id: string | null
  customer_name: string | null
  notes: string | null
  created_by: string
  created_at: string
  resolved_at: string | null
}

export const RETURN_TYPE_LABELS: Record<ReturnRecord['return_type'], string> = {
  customer_return: 'Customer Return',
  damaged_stock: 'Damaged Stock',
  supplier_return: 'Supplier Return',
}

export const REASON_LABELS: Record<ReturnRecord['reason'], string> = {
  damaged: 'Damaged',
  defective: 'Defective',
  wrong_item: 'Wrong Item',
  expired: 'Expired',
  other: 'Other',
}

export const RESOLUTION_OPTIONS_BY_TYPE: Record<ReturnRecord['return_type'], { value: ReturnRecord['resolution']; label: string }[]> = {
  customer_return: [
    { value: 'replace', label: 'Replace with new unit' },
    { value: 'refund', label: 'Refund (no restock)' },
    { value: 'restock', label: 'Restock (not actually damaged)' },
  ],
  damaged_stock: [
    { value: 'write_off', label: 'Write off (remove from stock)' },
  ],
  supplier_return: [
    { value: 'supplier_credit', label: 'Sent to supplier for credit/replacement' },
  ],
}

export const RESOLUTION_LABELS: Record<ReturnRecord['resolution'], string> = {
  replace: 'Replacement',
  refund: 'Refund',
  restock: 'Restock',
  write_off: 'Write Off',
  supplier_credit: 'Supplier Credit',
}

export const RESOLUTION_OPTION_DESCRIPTIONS: Record<ReturnRecord['resolution'], string> = {
  replace: 'Restocks the returned item, then ships a replacement of the same quantity (net-zero stock).',
  refund: 'No stock change — the customer keeps the item or it is discarded. The refund amount is deducted from revenue.',
  restock: 'Adds the returned quantity back into sellable stock.',
  write_off: 'Removes the quantity from sellable stock (destroyed / unsellable).',
  supplier_credit: 'Removes the quantity from sellable stock and credits the supplier.',
}

export const RESOLUTION_BADGE_VARIANT: Record<ReturnRecord['resolution'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  replace: 'default',
  refund: 'secondary',
  restock: 'outline',
  write_off: 'destructive',
  supplier_credit: 'secondary',
}