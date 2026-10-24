import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, getStoredUser } from '../lib/apiClient'
import type { InvoiceData } from '../lib/generateInvoice'
import type { InventoryItem } from '../types/inventory'
import type { AuthUser } from './useAuth'

export interface CartLine {
  item: InventoryItem
  quantity: number
  sellMode?: 'box' | 'piece' | 'yard' | 'bundle' | 'cut'
}

export const MM_PER_YARD = 914.4

export function isYardItem(item: InventoryItem): boolean {
  return item.unit_of_measure === 'yard'
}

export function isYardCutItem(item: InventoryItem): boolean {
  return isYardItem(item) && Number(item.cut_size_mm) > 0
}

export function defaultSellMode(item: InventoryItem): CartLine['sellMode'] {
  if (isYardCutItem(item)) return 'cut'
  if (isYardItem(item)) return 'yard'
  return undefined
}

export function basePieceQuantity(line: CartLine): number {
  const upb = line.item.unit_type === 'box' ? line.item.units_per_box : null
  if (!upb) return line.quantity
  return line.sellMode === 'piece' ? line.quantity : line.quantity * upb
}

export function stockQuantity(line: CartLine): number {
  if (!isYardItem(line.item)) return basePieceQuantity(line)
  const yardQuantity = line.sellMode === 'bundle'
    ? line.quantity * Number(line.item.bundle_yards ?? 0)
    : line.sellMode === 'cut'
      ? line.quantity * Number(line.item.cut_size_mm ?? 0) / MM_PER_YARD
      : line.quantity
  return Math.round(yardQuantity * 1_000_000) / 1_000_000
}

export function pricePerBaseUnit(line: CartLine): number {
  const price = line.item.unit_price ?? 0
  if (isYardItem(line.item)) {
    if (line.sellMode === 'bundle') return Number(line.item.bundle_price ?? 0)
    if (line.sellMode === 'cut') {
      const cutPrice = price * Number(line.item.cut_size_mm ?? 0) / MM_PER_YARD
      return Math.round(cutPrice * 100) / 100
    }
    return price
  }
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
  if (isYardItem(line.item)) {
    if (line.sellMode === 'bundle') return 'bundle'
    if (line.sellMode === 'cut') return `${line.item.cut_size_mm} mm cut`
    return 'yard'
  }
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
  dueDate?: string
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
      dueDate,
      companyName,
    }: CheckoutInput): Promise<{ invoiceData: InvoiceData; invoiceNumber: string; shareText: string }> => {
      const user = getStoredUser<AuthUser>()

      const checkoutPayload = {
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        shipping_address: shippingAddress,
        payment_method: paymentStatus,
        due_date: dueDate,
        location_id: locationId,
        items: cart.map((line) => ({
          id: line.item.id,
          sku: line.item.sku,
          name: line.item.name,
          quantity: isYardItem(line.item) ? line.quantity : stockQuantity(line),
          unit_price: pricePerBaseUnit(line),
          sale_unit: line.sellMode ?? 'unit',
        })),
      }

      const res = await api.post<{ so_number: string; so_id: string }>('/pos/checkout', checkoutPayload)
      const soNumber = res?.so_number || `SO-${Date.now().toString().slice(-8)}`

      const invoiceData: InvoiceData = {
        paperSize: 'pos',
        invoiceNumber: soNumber,
        invoiceCount,
        soNumber,
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        processedBy: user?.email ?? undefined,
        paymentStatus,
        note: paymentStatus === 'Credit' && dueDate
          ? `Credit due ${dueDate} · Balance GHC ${cart.reduce((sum, line) => sum + lineSubtotal(line), 0).toFixed(2)}`
          : undefined,
        companyName,
        items: cart.map((line) => ({
          sku: line.item.sku,
          name: line.item.name,
          quantity: line.quantity,
          unitPrice: pricePerBaseUnit(line),
          unitLabel: invoiceUnitLabel(line),
        })),
      }

      return {
        invoiceData,
        invoiceNumber: soNumber,
        shareText: `Invoice ${soNumber} from ${companyName}. Total: GHC ${cart.reduce((sum, line) => sum + lineSubtotal(line), 0).toFixed(2)}.`,
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