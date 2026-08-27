import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '../lib/supabaseClient'
import { generateInvoiceBlob } from '../lib/generateInvoice'
import { useAuth } from './useAuth'
import type { InventoryItem } from '../types/inventory'

export interface CartLine {
  item: InventoryItem
  quantity: number
  // Only meaningful when item.unit_type === 'box' && item.units_per_box is set.
  // 'box' (default): quantity counts whole boxes. 'piece': quantity counts
  // individual pieces broken out of a box.
  sellMode?: 'box' | 'piece'
}

// Inventory stock (and reorder levels) for a box item with units_per_box set
// is tracked in pieces — the base sellable unit — so a box can be sold whole
// or broken open without losing track of stock. This converts a cart line's
// display quantity into that base-unit quantity for stock checks/deduction.
export function basePieceQuantity(line: CartLine): number {
  const upb = line.item.unit_type === 'box' ? line.item.units_per_box : null
  if (!upb) return line.quantity
  return line.sellMode === 'piece' ? line.quantity : line.quantity * upb
}

// Price per base unit (per piece, when selling loose from a box; otherwise
// the item's normal unit_price). Used for records that need a true
// per-base-unit price rather than the display-quantity subtotal.
export function pricePerBaseUnit(line: CartLine): number {
  const price = line.item.unit_price ?? 0
  const upb = line.item.unit_type === 'box' ? line.item.units_per_box : null
  if (upb && line.sellMode === 'piece') {
    return price / upb
  }
  return price
}

// Price for the cart line's display quantity (boxes or loose pieces,
// whichever sellMode is active) — used for cart/invoice subtotals.
export function lineSubtotal(line: CartLine): number {
  return line.quantity * pricePerBaseUnit(line)
}

// Human-readable unit label for the invoice line ("box", "pcs", "kg", etc.)
export function invoiceUnitLabel(line: CartLine): string {
  const upb = line.item.unit_type === 'box' ? line.item.units_per_box : null
  if (upb) return line.sellMode === 'piece' ? 'pcs' : 'box'
  if (line.item.unit_type === 'box') return 'box'
  if (line.item.unit_of_measure) return line.item.unit_of_measure
  return 'unit'
}

interface CheckoutInput {
  cart: CartLine[]
  locationId: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  shippingAddress?: string
  paymentStatus: string
  companyName: string
}

export function usePointOfSaleCheckout() {
  const queryClient = useQueryClient()

  useAuth()

  return useMutation({
    mutationFn: async ({
      cart,
      locationId,
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      paymentStatus,
      companyName,
    }: CheckoutInput): Promise<string> => {
      const { data: authSession } = await supabase.auth.getSession()
      const userId = authSession.session?.user?.id
      if (!userId) throw new Error('Not authenticated')

      const soNumber = `SO-${Date.now().toString().slice(-8)}`

      // 1. Create the sales order
      const { data: so, error: soError } = await supabase
        .from('sales_orders')
        .insert({ so_number: soNumber, status: 'confirmed', created_by: userId })
        .select()
        .single()
      if (soError) throw new Error(soError.message)

      // 2. Create line items. quantity_ordered must be in the same base
      // unit as inventory_items.quantity (pieces, for box items with a
      // units_per_box conversion set) since ship_sales_order deducts it
      // 1:1 from stock — it has no knowledge of "sold as a box" vs.
      // "sold as loose pieces".
      const itemRows = cart.map((line) => ({
        so_id: so.id,
        sku: line.item.sku,
        inventory_item_id: Number(line.item.id),
        quantity_ordered: basePieceQuantity(line),
        unit_price: pricePerBaseUnit(line),
      }))
      const { error: itemsError } = await supabase.from('sales_order_items').insert(itemRows)
      if (itemsError) throw new Error(itemsError.message)

      // 3. Ship immediately (FIFO deduction via the RPC)
      const { error: shipError } = await supabase.rpc('ship_sales_order', {
        p_so_id: so.id,
        p_location_id: locationId,
        p_items: null,
      })
      if (shipError) throw new Error(shipError.message)

      // 4. Generate invoice blob URL for preview
      const { data: invoiceSession } = await supabase.auth.getSession()
      const processedBy = invoiceSession.session?.user?.email ?? undefined

      const blobUrl = generateInvoiceBlob({
        invoiceNumber: soNumber,
        soNumber,
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        processedBy,
        paymentStatus,
        companyName,
        items: cart.map((line) => ({
          sku: line.item.sku,
          name: line.item.name,
          quantity: line.quantity,
          unitPrice: pricePerBaseUnit(line),
          unitLabel: invoiceUnitLabel(line),
        })),
      })

      return blobUrl
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_items'] })
      queryClient.invalidateQueries({ queryKey: ['sales_orders'] })
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] })
      queryClient.invalidateQueries({ queryKey: ['inventory_batches'] })

      toast.success('Sale completed successfully')
    },
    onError: (error: Error) => {
      toast.error(`Checkout failed: ${error.message}`)
    },
  })
}