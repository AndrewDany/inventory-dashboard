import { useState, useMemo, useRef, lazy, Suspense } from 'react'
import { Plus, Minus, Trash2, ScanLine, Receipt, Printer, Mail, MessageCircle, Send, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { useInventory } from '../hooks/useInventory'
import type { InventoryItem } from '../types/inventory'
import { useLocations } from '../hooks/useLocations'
import { usePointOfSaleCheckout, type CartLine } from '../hooks/usePointOfSale'
import { api } from '../lib/apiClient'
const BarcodeScanner = lazy(() => import('../components/inventory/BarcodeScanner'))
import PageLayout from '../components/layout/PageLayout'
import Modal from '../components/ui/Modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/contexts/LanguageContext'
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
  const { t } = useLanguage()
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
  const [customerVerified, setCustomerVerified] = useState(false)
  const [isVerifyingCustomer, setIsVerifyingCustomer] = useState(false)
  const [shippingAddress, setShippingAddress] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('Cash')
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null)
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [invoiceShareText, setInvoiceShareText] = useState('')
  const [invoiceCount, setInvoiceCount] = useState(() => {
    const today = new Date().toISOString().slice(0, 10)
    const stored = JSON.parse(localStorage.getItem('pos_invoice_daily_count') || 'null') as { date?: string; count?: number } | null
    return stored?.date === today ? Number(stored.count || 0) : 0
  })
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

  const stockBySku = useMemo(() => {
    return (items ?? []).reduce<Record<string, number>>((acc, item) => {
      acc[item.sku] = (acc[item.sku] ?? 0) + Number(item.quantity ?? 0)
      return acc
    }, {})
  }, [items])

  function addToCart(item: (typeof filteredItems)[number]) {
    const available = stockBySku[item.sku] ?? 0
    const existingQty = cart.find((line) => line.item.id === item.id)?.quantity ?? 0

    if (existingQty + 1 > available) {
      toast.warning(`Only ${available} ${item.sku} available in stock.`)
      return
    }

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

    if (customerPhone && !/^\d{10}$/.test(customerPhone)) {
      toast.error('Contact phone must contain exactly 10 digits.')
      return
    }

    if (customerPhone && !customerName.trim()) {
      toast.error('Enter the customer name before completing the first purchase.')
      return
    }

    if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      toast.error('Enter a valid email address.')
      return
    }

    const hasOversell = cart.some((line) => (stockBySku[line.item.sku] ?? 0) < line.quantity)
    if (hasOversell) {
      toast.error('One or more items exceed available stock at this location.')
      return
    }

    try {
      const nextCount = invoiceCount + 1
      const invoice = await checkout.mutateAsync({
        cart,
        invoiceCount: nextCount,
        locationId,
        customerName: customerName || undefined,
        customerEmail: customerEmail || undefined,
        customerPhone: customerPhone || undefined,
        shippingAddress: shippingAddress || undefined,
        paymentStatus,
        companyName: 'samdamventures.com',
      })
      localStorage.setItem('pos_invoice_daily_count', JSON.stringify({
        date: new Date().toISOString().slice(0, 10),
        count: nextCount,
      }))
      setInvoiceCount(nextCount)
      setInvoiceNumber(invoice.invoiceNumber)
      setInvoiceShareText(invoice.shareText)
      setInvoiceUrl(invoice.blobUrl ?? null)
      setShowInvoiceModal(true)
      setCart([])
      setCustomerName('')
      setCustomerEmail('')
      setCustomerPhone('')
      setCustomerVerified(false)
      setShippingAddress('')
      setPaymentStatus('Cash')
    } catch {
      // Error handled by mutation's onError toast
    }
  }

  async function verifyCustomer() {
    if (!/^\d{10}$/.test(customerPhone)) {
      toast.error('Enter exactly 10 digits to verify the customer.')
      return
    }

    setIsVerifyingCustomer(true)
    try {
      const customer = await api.get<{
        full_name: string
        phone: string
        email: string | null
        delivery_address: string | null
      } | null>(`/customers?phone=${customerPhone}`)

      if (!customer) {
        setCustomerVerified(false)
        toast.info('New customer. Enter their name, then complete the purchase to register them.')
        return
      }

      setCustomerName(customer.full_name)
      setCustomerEmail(customer.email ?? '')
      setShippingAddress(customer.delivery_address ?? '')
      setCustomerVerified(true)
      toast.success(`Customer verified: ${customer.full_name}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Customer verification failed'
      toast.error(message)
    } finally {
      setIsVerifyingCustomer(false)
    }
  }

  function handlePrint() {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.print()
    }
  }

  function downloadInvoicePdf() {
    if (!invoiceUrl) return
    const link = document.createElement('a')
    link.href = invoiceUrl
    link.download = `invoice-${invoiceNumber}.pdf`
    link.click()
  }

  function shareTo(channel: 'whatsapp' | 'email' | 'telegram') {
    downloadInvoicePdf()
    const urls = {
      whatsapp: 'whatsapp://send',
      email: `mailto:?subject=${encodeURIComponent(`Invoice ${invoiceNumber} PDF`)}`,
      telegram: 'https://web.telegram.org/',
    }
    window.open(urls[channel], '_blank', 'noopener,noreferrer')
    toast.info(`Invoice ${invoiceNumber} PDF downloaded. Attach it in ${channel}.`)
  }

  async function handleWhatsAppShare() {
    if (navigator.share && invoiceUrl) {
      try {
        const pdfBlob = await fetch(invoiceUrl).then((response) => response.blob())
        const pdfFile = new File([pdfBlob], `invoice-${invoiceNumber}.pdf`, { type: 'application/pdf' })
        if (navigator.canShare?.({ files: [pdfFile] })) {
          await navigator.share({ title: `Invoice ${invoiceNumber}`, files: [pdfFile] })
          return
        }
      } catch {
        // Fall back to download and the installed WhatsApp app below.
      }
    }

    shareTo('whatsapp')
  }

  async function handleNativeShare() {
    if (!navigator.share) {
      toast.info('Native sharing is not supported in this browser.')
      return
    }
    try {
      const pdfBlob = invoiceUrl ? await fetch(invoiceUrl).then((response) => response.blob()) : null
      const pdfFile = pdfBlob ? new File([pdfBlob], `invoice-${invoiceNumber}.pdf`, { type: 'application/pdf' }) : null
      const shareData = pdfFile && navigator.canShare?.({ files: [pdfFile] })
        ? { title: `Invoice ${invoiceNumber}`, text: invoiceShareText, files: [pdfFile] }
        : { title: `Invoice ${invoiceNumber}`, text: invoiceShareText }
      await navigator.share(shareData)
    } catch {
      // The share sheet may be closed without completing the share.
    }
  }

  function getUnitLabel(item: InventoryItem): string {
    if (item.unit_of_measure) {
      return item.unit_of_measure
    }
    return item.unit_type === 'weight' ? 'unit' : 'piece'
  }

  return (
    <PageLayout title="Point of Sale">
      <div className="mb-4 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Invoices issued</p>
          <p className="text-2xl font-bold text-slate-900">{invoiceCount}</p>
        </div>
        <p className="text-xs text-slate-500">Next invoice: {invoiceCount + 1}</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: search + item results (3/4 width) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Stage Sale Item */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('Stage Sale Item')}</h3>
            <div className="flex gap-3">
              <Input
                placeholder={t('Select Available Product SKU...')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" size="icon" onClick={() => setShowScanner(true)}>
                <ScanLine size={16} />
              </Button>
            </div>

            {showScanner && (
              <Suspense fallback={null}>
                <BarcodeScanner
                  onClose={() => setShowScanner(false)}
                  onScan={(code) => {
                    const match = items?.find((i) => i.sku === code)
                    if (match) addToCart(match)
                    setShowScanner(false)
                  }}
                />
              </Suspense>
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
                      <p className="text-xs text-gray-500">
                        {item.sku} · {item.quantity} {getUnitLabel(item)} in stock
                      </p>
                    </div>
                    <span className="text-sm font-medium">GHC {(item.unit_price ?? 0).toFixed(2)}</span>
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
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{line.item.name}</span>
                          <span className="text-xs text-gray-500">{line.item.sku}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        GHC {(line.item.unit_price ?? 0).toFixed(2)}
                        {line.item.unit_of_measure && (
                          <span className="text-xs text-gray-400 ml-1">/{line.item.unit_of_measure}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {line.item.unit_type === 'weight' ? (
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.quantity}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value))
                              setCart((prev) =>
                                prev
                                  .map((l) => (l.item.id === line.item.id ? { ...l, quantity: val } : l))
                                  .filter((l) => l.quantity > 0)
                              )
                            }}
                            className="w-20 text-right inline-block"
                          />
                        ) : (
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
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        GHC {(line.quantity * (line.item.unit_price ?? 0)).toFixed(2)}
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

            {cart.length > 0 && (
              <div className="mt-4 space-y-1 border-t border-gray-100 pt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Basket Subtotal:</span>
                  <span className="font-medium">GHC {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-gray-900">Grand Total Paid:</span>
                  <span className="text-lg">GHC {grandTotal.toFixed(2)}</span>
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
              autoComplete="email"
            />
          </div>

          {/* Contact Phone */}
          <div>
            <Label htmlFor="customer-phone" className="mb-1 block">Contact Phone</Label>
            <div className="flex gap-2">
              <Input
                id="customer-phone"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
                value={customerPhone}
                onChange={(e) => {
                  setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                  setCustomerVerified(false)
                }}
                placeholder="0241234567"
              />
              <Button type="button" variant="outline" onClick={verifyCustomer} disabled={isVerifyingCustomer || customerPhone.length !== 10}>
                {isVerifyingCustomer ? 'Checking...' : 'Verify'}
              </Button>
            </div>
            <p className="mt-1 text-xs text-slate-500">Enter 10 digits only.</p>
            {customerVerified && <p className="mt-1 text-xs font-medium text-emerald-600">Customer details verified.</p>}
          </div>

          {/* Delivery Address */}
          <div>
            <Label htmlFor="delivery-address" className="mb-1 block">Delivery Address</Label>
            <Input
              id="delivery-address"
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
                <SelectValue placeholder="Select a location" />
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

          {/* Payment Method */}
          <div>
            <Label className="mb-1 block">Payment Method</Label>
            <Select value={paymentStatus} onValueChange={(v) => setPaymentStatus(v ?? 'Cash')}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Mobile Money">Mobile Money</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border-t border-gray-100 pt-3 flex justify-between text-sm font-semibold">
            <span>Total</span>
            <span>GHC {grandTotal.toFixed(2)}</span>
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
            <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-600">Invoice {invoiceNumber}</p>
              <p className="mt-1 text-sm text-indigo-900">Invoice {invoiceCount} of your issued invoices</p>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <iframe
                ref={iframeRef}
                src={invoiceUrl}
                className="w-full h-125"
                title="Invoice Preview"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
              <Button className="min-w-35 flex-1" variant="outline" onClick={handleWhatsAppShare} title="Share invoice PDF to WhatsApp">
                <MessageCircle size={16} className="mr-2 text-emerald-600" /> WhatsApp
              </Button>
              <Button className="min-w-30 flex-1" variant="outline" onClick={() => shareTo('email')} title="Share by email">
                <Mail size={16} className="mr-2 text-blue-600" /> Email
              </Button>
              <Button className="min-w-30 flex-1" variant="outline" onClick={() => shareTo('telegram')} title="Share on Telegram">
                <Send size={16} className="mr-2 text-sky-600" /> Telegram
              </Button>
              <Button className="min-w-30 flex-1" variant="outline" onClick={handleNativeShare} title="Share invoice">
                <Share2 size={16} className="mr-2" /> Share
              </Button>
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
