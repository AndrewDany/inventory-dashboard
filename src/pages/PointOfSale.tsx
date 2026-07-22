import { useState, useMemo, useRef } from 'react'
import { Plus, Minus, Trash2, ScanLine, Receipt, Printer } from 'lucide-react'
import { useInventory } from '../hooks/useInventory'
import { useLocations } from '../hooks/useLocations'
import { usePointOfSaleCheckout, type CartLine } from '../hooks/usePointOfSale'
import BarcodeScanner from '../components/inventory/BarcodeScanner'
import PageLayout from '../components/layout/PageLayout'
import Modal from '../components/ui/Modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function PointOfSale() {
  const { data: items } = useInventory()
  const { data: locations } = useLocations()
  const checkout = usePointOfSaleCheckout()

  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartLine[]>([])
  const [showScanner, setShowScanner] = useState(false)
  const [locationId, setLocationId] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [shippingAddress, setShippingAddress] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('Paid')
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const filteredItems = useMemo(() => {
    if (!search) return []
    return (items ?? []).filter(
      (item) =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.sku.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 6)
  }, [items, search])

  function addToCart(item: (typeof filteredItems)[number]) {
    setCart((prev) => {
      const existing = prev.find((line) => line.item.id === item.id)
      if (existing) {
        return prev.map((line) =>
          line.item.id === item.id ? { ...line, quantity: line.quantity + 1 } : line
        )
      }
      return [...prev, { item, quantity: 1 }]
    })
    setSearch('')
  }

  function updateQty(itemId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((line) => (line.item.id === itemId ? { ...line, quantity: line.quantity + delta } : line))
        .filter((line) => line.quantity > 0)
    )
  }

  function removeLine(itemId: string) {
    setCart((prev) => prev.filter((line) => line.item.id !== itemId))
  }

  const subtotal = cart.reduce((sum, line) => sum + line.quantity * (line.item.unit_price ?? 0), 0)
  const grandTotal = subtotal

  async function handleCheckout() {
    if (cart.length === 0 || !locationId) return
    try {
      const blobUrl = await checkout.mutateAsync({
        cart,
        locationId,
        customerName: customerName || undefined,
        customerEmail: customerEmail || undefined,
        customerPhone: customerPhone || undefined,
        shippingAddress: shippingAddress || undefined,
        paymentStatus,
        companyName: 'Inventory Dashboard',
      })
      setInvoiceUrl(blobUrl ?? null)
      setShowInvoiceModal(true)
      setCart([])
      setCustomerName('')
      setCustomerEmail('')
      setCustomerPhone('')
      setShippingAddress('')
      setPaymentStatus('Paid')
    } catch {
      // Error handled by mutation's onError toast
    }
  }

  function handlePrint() {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.print()
    }
  }

  return (
    <PageLayout title="Point of Sale">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: search + item results (3/4 width) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Stage Sale Item */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Stage Sale Item</h3>
            <div className="flex gap-3">
              <Input
                placeholder="Select Available Product SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" size="icon" onClick={() => setShowScanner(true)}>
                <ScanLine size={16} />
              </Button>
            </div>

            {showScanner && (
              <BarcodeScanner
                onClose={() => setShowScanner(false)}
                onScan={(code) => {
                  const match = items?.find((i) => i.sku === code)
                  if (match) addToCart(match)
                  setShowScanner(false)
                }}
              />
            )}

            {filteredItems.length > 0 && (
              <div className="mt-3 bg-white rounded-lg border border-gray-200 divide-y">
                {filteredItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className="w-full flex justify-between items-center p-3 hover:bg-gray-50 text-left"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.sku} · {item.quantity} in stock</p>
                    </div>
                    <span className="text-sm font-medium">GHS {(item.unit_price ?? 0).toFixed(2)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Staged Items Cart Table */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Staged Items</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Catalog Product Line</TableHead>
                  <TableHead className="text-right">Retail Unit Price</TableHead>
                  <TableHead className="text-right">Checkout Qty</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                      Staged item cart is empty. Add SKUs above.
                    </TableCell>
                  </TableRow>
                ) : (
                  cart.map((line) => (
                    <TableRow key={line.item.id}>
                      <TableCell className="font-medium">{line.item.name}</TableCell>
                      <TableCell className="text-right">
                        GHS {(line.item.unit_price ?? 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => updateQty(line.item.id, -1)}
                            className="p-1 text-gray-500 hover:text-gray-700"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-6 text-center text-sm">{line.quantity}</span>
                          <button
                            onClick={() => updateQty(line.item.id, 1)}
                            className="p-1 text-gray-500 hover:text-gray-700"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        GHS {(line.quantity * (line.item.unit_price ?? 0)).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          onClick={() => removeLine(line.item.id)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={14} />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Basket Summary */}
            {cart.length > 0 && (
              <div className="mt-4 border-t border-gray-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Basket Subtotal:</span>
                  <span className="font-medium">GHS {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-gray-900">Grand Total Paid:</span>
                  <span className="text-lg">GHS {grandTotal.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: checkout panel (1/4 width) */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 h-fit space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Customer Details</h3>

          {/* Customer Name */}
          <div>
            <Label htmlFor="customer-name" className="mb-1 block">Customer Name</Label>
            <Input
              id="customer-name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="John Doe"
            />
          </div>

          {/* Invoicing Email */}
          <div>
            <Label htmlFor="customer-email" className="mb-1 block">Invoicing Email</Label>
            <Input
              id="customer-email"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="john@example.com"
            />
          </div>

          {/* Contact Phone */}
          <div>
            <Label htmlFor="customer-phone" className="mb-1 block">Contact Phone</Label>
            <Input
              id="customer-phone"
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+233 55 123 4567"
            />
          </div>

          {/* Shipping Address */}
          <div>
            <Label htmlFor="shipping-address" className="mb-1 block">Shipping Destination Address</Label>
            <Input
              id="shipping-address"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="Accra, Ghana"
            />
          </div>

          {/* Location */}
          <div>
            <Label className="mb-1 block">Location</Label>
            <Select value={locationId} onValueChange={(v) => setLocationId(v ?? '')}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a location">
                  {locationId && locations?.find((l) => l.id === locationId)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {locations?.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Status */}
          <div>
            <Label className="mb-1 block">Payment Status</Label>
            <Select value={paymentStatus} onValueChange={(v) => setPaymentStatus(v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Canceled">Canceled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border-t border-gray-100 pt-3 flex justify-between text-sm font-semibold">
            <span>Total</span>
            <span>GHS {grandTotal.toFixed(2)}</span>
          </div>

          <Button
            className="w-full"
            disabled={cart.length === 0 || !locationId || checkout.isPending}
            onClick={handleCheckout}
          >
            <Receipt size={16} className="mr-2" />
            {checkout.isPending ? 'Processing...' : 'Complete Sale'}
          </Button>
        </div>
      </div>

      {/* Invoice Preview Modal */}
      {showInvoiceModal && invoiceUrl && (
        <Modal title="Invoice Preview" onClose={() => { setShowInvoiceModal(false) }}>
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <iframe
                ref={iframeRef}
                src={invoiceUrl}
                className="w-full h-[500px]"
                title="Invoice Preview"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setShowInvoiceModal(false) }}>
                Close
              </Button>
              <Button onClick={handlePrint}>
                <Printer size={16} className="mr-2" />
                Print
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </PageLayout>
  )
}

