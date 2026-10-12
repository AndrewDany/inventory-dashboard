import { useEffect, useMemo, useState } from 'react'
import { Download, FileText, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSalesOrders } from '../../hooks/useSalesOrders'
import { generateInvoiceBlob, preloadInvoiceBlob, type InvoiceData } from '../../lib/generateInvoice'
import { parseUtcTimestamp } from '../../lib/relativeTime'

type InvoiceOrder = {
  id: string
  so_number: string
  status: string
  customer_name: string | null
  customer_phone: string | null
  created_at: string
  amount_paid?: number | string | null
  sales_order_items: Array<{
    sku: string
    quantity_ordered: number
    quantity_shipped: number
    unit_price: number | null
    currency: string | null
    item_name?: string | null
  }>
}

function orderTotal(order: InvoiceOrder) {
  return order.sales_order_items.reduce(
    (total, item) => total + item.quantity_shipped * (item.unit_price ?? 0),
    0,
  )
}

function downloadUrl(url: string, filename: string) {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

function invoiceData(order: InvoiceOrder, invoiceCount: number): InvoiceData {
  return {
    invoiceNumber: order.so_number,
    invoiceCount,
    soNumber: order.so_number,
    customerName: order.customer_name ?? undefined,
    customerPhone: order.customer_phone ?? undefined,
    paymentStatus: 'Paid',
    companyName: 'samdamventures.com',
    issuedAt: order.created_at,
    items: order.sales_order_items.map((item) => ({
      sku: item.sku,
      name: item.item_name ?? item.sku,
      quantity: Number(item.quantity_shipped),
      unitPrice: Number(item.unit_price ?? 0),
    })),
  }
}

export default function AdminInvoiceHistory() {
  const { data: orders, isLoading, error } = useSalesOrders()
  const [search, setSearch] = useState('')

  const invoices = useMemo(() => {
    const completed = ((orders ?? []) as InvoiceOrder[])
      .filter((order) => order.status === 'shipped')
      .sort((a, b) => parseUtcTimestamp(a.created_at).getTime() - parseUtcTimestamp(b.created_at).getTime())

    const query = search.trim().toLowerCase()
    return completed
      .map((order, index) => ({ order, invoiceCount: index + 1 }))
      .filter(({ order }) => {
        if (!query) return true
        return [order.so_number, order.customer_name, order.customer_phone]
          .some((value) => value?.toLowerCase().includes(query))
      })
      .reverse()
  }, [orders, search])

  useEffect(() => {
    const newestInvoice = invoices[0]
    if (!newestInvoice) return

    const timeout = window.setTimeout(() => {
      preloadInvoiceBlob(invoiceData(newestInvoice.order, newestInvoice.invoiceCount))
    }, 250)
    return () => window.clearTimeout(timeout)
  }, [invoices])

  async function downloadInvoice(order: InvoiceOrder, invoiceCount: number) {
    try {
      const url = await generateInvoiceBlob(invoiceData(order, invoiceCount))
      downloadUrl(url, `invoice-${order.so_number}.pdf`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to generate invoice PDF')
    }
  }

  function exportCsv() {
    const rows = invoices.map(({ order, invoiceCount }) => [
      invoiceCount,
      order.so_number,
      parseUtcTimestamp(order.created_at).toLocaleString(),
      order.customer_name ?? '',
      order.customer_phone ?? '',
      orderTotal(order).toFixed(2),
      order.status,
    ])
    const csv = [
      ['Invoice Count', 'Invoice Number', 'Date', 'Customer', 'Phone', 'Total (GHC)', 'Status'],
      ...rows,
    ].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n')
    downloadUrl(URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })), 'invoice-history.csv')
  }

  if (isLoading) return <p className="text-sm text-gray-500">Loading invoice history...</p>
  if (error) return <p className="text-sm text-red-600">Error: {error.message}</p>

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Invoice History</h3>
          <p className="mt-1 text-sm text-slate-500">Download or reprint completed invoices.</p>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={invoices.length === 0}>
          <Download size={16} className="mr-2" /> Export CSV
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input className="pl-9" placeholder="Search invoice, customer, or phone" value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>

      {invoices.length === 0 ? (
        <p className="text-sm text-gray-500">No completed invoices found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Count</th>
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map(({ order, invoiceCount }) => (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold text-slate-900">{invoiceCount}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{order.so_number}</td>
                  <td className="px-4 py-3 text-slate-500">{parseUtcTimestamp(order.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">{order.customer_name || 'Walk-in Customer'}</td>
                  <td className="px-4 py-3 text-right font-semibold">GHC {orderTotal(order).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onMouseEnter={() => preloadInvoiceBlob(invoiceData(order, invoiceCount))}
                      onFocus={() => preloadInvoiceBlob(invoiceData(order, invoiceCount))}
                      onClick={() => downloadInvoice(order, invoiceCount)}
                    >
                      <FileText size={15} className="mr-1" /> Download PDF
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}