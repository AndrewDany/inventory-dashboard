import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '../lib/supabaseClient'
import { generateInvoiceBlob } from '../lib/generateInvoice'
import type { InventoryItem } from '../types/inventory'

export interface CartLine {
  item: InventoryItem
  quantity: number
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
      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData.session?.user.id
      if (!userId) throw new Error('Not authenticated')

      const soNumber = `SO-${Date.now().toString().slice(-8)}`

      // 1. Create the sales order
      const { data: so, error: soError } = await supabase
        .from('sales_orders')
        .insert({ so_number: soNumber, status: 'confirmed', created_by: userId })
        .select()
        .single()
      if (soError) throw new Error(soError.message)

      // 2. Create line items
      const itemRows = cart.map((line) => ({
        so_id: so.id,
        sku: line.item.sku,
        inventory_item_id: Number(line.item.id),
        quantity_ordered: line.quantity,
        unit_price: line.item.unit_price ?? 0,
      }))
      const { error: itemsError } = await supabase.from('sales_order_items').insert(itemRows)
      if (itemsError) throw new Error(itemsError.message)

      // 3. Ship immediately (FIFO deduction via the RPC)
      const { data: shipResult, error: shipError } = await supabase.rpc('ship_sales_order', {
        p_so_id: so.id,
        p_location_id: locationId,
        p_items: null,
      })
      if (shipError) throw new Error(shipError.message)

      // 4. Generate invoice blob URL for preview
      const { data: session } = await supabase.auth.getSession()
      const processedBy = session?.session?.user?.email ?? undefined

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
          unitPrice: line.item.unit_price ?? 0,
        })),
      })

      return blobUrl
    },
    onSuccess: (_data, variables) => {
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

