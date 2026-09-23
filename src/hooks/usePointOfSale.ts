import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, getStoredUser } from '../lib/apiClient'
import { generateInvoiceBlob } from '../lib/generateInvoice'
import type { InventoryItem } from '../types/inventory'
import type { AuthUser } from './useAuth'

export interface CartLine {
  item: InventoryItem
  quantity: number
  sellMode?: 'box' | 'piece'
}

export function basePieceQuantity(line: CartLine): number {
  const upb = line.item.unit_type === 'box' ? line.item.units_per_box : null
  if (!upb) return line.quantity
  return line.sellMode === 'piece' ? line.quantity : line.quantity * upb
}

export function pricePerBaseUnit(line: CartLine): number {
  const price = line.item.unit_price ?? 0
  const upb = line.item.unit_type === 'box' ? line.item.units_per_box : null
  if (upb && line.sellMode === 'piece') {
    return price / upb
  }
  return price
}

export function lineSubtotal(line: CartLine): number {
  return line.quantity * pricePerBaseUnit(line)
}

export function invoiceUnitLabel(line: CartLine): string {
  const upb = line.item.unit_type === 'box' ? line.item.units_per_box : null
  if (upb) return line.sellMode === 'piece' ? 'pcs' : 'box'
  if (line.item.unit_type === 'box') return 'box'
  if (line.item.unit_of_measure) return line.item.unit_of_measure
  return 'unit'
}

interface CheckoutInput {
  cart: CartLine[]
  invoiceCount: number
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
      invoiceCount,
      locationId,
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      paymentStatus,
      companyName,
    }: CheckoutInput): Promise<{ blobUrl: string; invoiceNumber: string; shareText: string }> => {
      const user = getStoredUser<AuthUser>()

      const checkoutPayload = {
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        shipping_address: shippingAddress,
        payment_method: paymentStatus,
        location_id: locationId,
        items: cart.map((line) => ({
          id: line.item.id,
          sku: line.item.sku,
          name: line.item.name,
          quantity: basePieceQuantity(line),
          unit_price: pricePerBaseUnit(line),
        })),
      }

      const res = await api.post<{ so_number: string; so_id: string }>('/pos/checkout', checkoutPayload)
      const soNumber = res?.so_number || `SO-${Date.now().toString().slice(-8)}`

      const blobUrl = generateInvoiceBlob({
        invoiceNumber: soNumber,
        invoiceCount,
        soNumber,
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        processedBy: user?.email ?? undefined,
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

      return {
        blobUrl,
        invoiceNumber: soNumber,
        shareText: `Invoice ${soNumber} from ${companyName}. Total: GHS ${cart.reduce((sum, line) => sum + lineSubtotal(line), 0).toFixed(2)}.`,
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_items'] })
      queryClient.invalidateQueries({ queryKey: ['sales_orders'] })
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] })
      queryClient.invalidateQueries({ queryKey: ['inventory_batches'] })
      queryClient.invalidateQueries({ queryKey: ['monthly_financials'] })
      queryClient.invalidateQueries({ queryKey: ['profit_loss'] })
      toast.success('Sale completed successfully')
    },
    onError: (error: Error) => {
      toast.error(`Checkout failed: ${error.message}`)
    },
  })
}