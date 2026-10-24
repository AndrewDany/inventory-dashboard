import { useMemo, useState } from 'react'
import { useCustomers, useCreateCustomer, useUpdateCreditLimit } from '../../hooks/useCustomers'
import { useRecordPreOrderPayment, useSalesOrders } from '../../hooks/useSalesOrders'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

function currentDateValue(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function AdminCustomers() {
  const { data: customers = [], isLoading, error } = useCustomers()
  const { data: orders = [], isLoading: ordersLoading, error: ordersError } = useSalesOrders()
  const createCustomer = useCreateCustomer()
  const updateLimit = useUpdateCreditLimit()
  const recordPayment = useRecordPreOrderPayment()
  const [selectedId, setSelectedId] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [limitDrafts, setLimitDrafts] = useState<Record<string, string>>({})
  const [paymentDrafts, setPaymentDrafts] = useState<Record<string, string>>({})
  const [paymentMethods, setPaymentMethods] = useState<Record<string, string>>({})

  const selectedCustomer = customers.find((customer) => customer.id === selectedId) ?? null
  const customerOrders = useMemo(
    () => orders.filter((order) => order.customer_id === selectedId && Number(order.is_preorder) !== 1),
    [orders, selectedId],
  )
  const totalOutstanding = customers.reduce((sum, customer) => sum + Number(customer.outstanding_balance), 0)
  const overdueCount = orders.filter((order) => {
    const total = order.sales_order_items.reduce((sum, item) => sum + item.quantity_ordered * (item.unit_price ?? 0), 0)
    return Number(order.is_preorder) !== 1
      && order.due_date
      && order.due_date < currentDateValue()
      && Number(order.amount_paid) < total
  }).length

  function handleAddCustomer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    createCustomer.mutate(
      { full_name: name, phone, email: email || undefined },
      { onSuccess: () => { setName(''); setPhone(''); setEmail('') } },
    )
  }

  function handleSaveLimit(customerId: string) {
    const value = Number(limitDrafts[customerId])
    if (!Number.isFinite(value) || value < 0) return
    updateLimit.mutate(
      { customerId, creditLimit: value },
      { onSuccess: () => setLimitDrafts((drafts) => ({ ...drafts, [customerId]: String(value) })) },
    )
  }

  function handleRecordPayment(orderId: string) {
    const amount = Number(paymentDrafts[orderId])
    if (!Number.isFinite(amount) || amount <= 0) return
    recordPayment.mutate(
      {
        so_id: orderId,
        amount,
        payment_method: paymentMethods[orderId] || 'Cash',
      },
      { onSuccess: () => setPaymentDrafts((drafts) => ({ ...drafts, [orderId]: '' })) },
    )
  }

  if (isLoading) return <p className="text-sm text-slate-500">Loading customer accounts...</p>
  if (error) return <p className="text-sm text-rose-600">Unable to load customers: {error.message}</p>

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Customer Credit Accounts</h2>
        <p className="mt-1 text-sm text-slate-500">Manage credit limits, outstanding balances, due dates, and customer payments.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs font-medium uppercase text-slate-500">Customers</p>
          <p className="mt-1 text-2xl font-semibold">{customers.length}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs font-medium uppercase text-slate-500">Outstanding credit</p>
          <p className="mt-1 text-2xl font-semibold text-amber-700">GHC {totalOutstanding.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs font-medium uppercase text-slate-500">Overdue invoices shown</p>
          <p className="mt-1 text-2xl font-semibold text-rose-700">{overdueCount}</p>
        </div>
      </div>

      <form onSubmit={handleAddCustomer} className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-4 sm:items-end">
        <div>
          <Label htmlFor="new-customer-name">Customer name</Label>
          <Input id="new-customer-name" value={name} onChange={(event) => setName(event.target.value)} required />
        </div>
        <div>
          <Label htmlFor="new-customer-phone">Phone</Label>
          <Input id="new-customer-phone" value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="0241234567" required />
          <p className="mt-1 text-xs text-slate-500">Enter 10 digits, including the leading 0.</p>
        </div>
        <div>
          <Label htmlFor="new-customer-email">Email (optional)</Label>
          <Input id="new-customer-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>
        <Button type="submit" disabled={createCustomer.isPending}>{createCustomer.isPending ? 'Adding...' : 'Add Customer'}</Button>
      </form>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
              <TableHead className="text-right">Credit limit (GHC)</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id} className={selectedId === customer.id ? 'bg-indigo-50/60' : undefined}>
                <TableCell className="font-medium">{customer.full_name}</TableCell>
                <TableCell>{customer.phone}</TableCell>
                <TableCell className="text-right font-medium">GHC {Number(customer.outstanding_balance).toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <Input
                    aria-label={`Credit limit for ${customer.full_name}`}
                    className="ml-auto max-w-36 text-right"
                    type="number"
                    min="0"
                    step="0.01"
                    value={limitDrafts[customer.id] ?? String(customer.credit_limit)}
                    onChange={(event) => setLimitDrafts((drafts) => ({ ...drafts, [customer.id]: event.target.value }))}
                  />
                </TableCell>
                <TableCell className="whitespace-nowrap text-right">
                  <Button variant="outline" size="sm" onClick={() => void handleSaveLimit(customer.id)} disabled={updateLimit.isPending}>Save limit</Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedId(customer.id)}>Account</Button>
                </TableCell>
              </TableRow>
            ))}
            {customers.length === 0 && (
              <TableRow><TableCell colSpan={5} className="py-8 text-center text-slate-500">No customers have been added.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {selectedCustomer && (
        <section className="space-y-3 rounded-xl border bg-white p-4">
          <div>
            <h3 className="font-semibold">{selectedCustomer.full_name} — Account activity</h3>
            <p className="text-sm text-slate-500">Available credit: GHC {Math.max(0, Number(selectedCustomer.credit_limit) - Number(selectedCustomer.outstanding_balance)).toFixed(2)}</p>
          </div>
          {ordersError ? (
            <p className="text-sm text-rose-600">Unable to load account activity: {ordersError.message}</p>
          ) : ordersLoading ? (
            <p className="text-sm text-slate-500">Loading account activity...</p>
          ) : customerOrders.length === 0 ? (
            <p className="text-sm text-slate-500">No point-of-sale invoices for this customer yet.</p>
          ) : customerOrders.map((order) => {
            const total = order.sales_order_items.reduce((sum, item) => sum + item.quantity_ordered * (item.unit_price ?? 0), 0)
            const balance = Math.max(0, total - Number(order.amount_paid))
            const overdue = balance > 0 && !!order.due_date && order.due_date < currentDateValue()
            return (
              <div key={order.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{order.so_number} <span className={overdue ? 'ml-2 text-xs font-semibold text-rose-700' : 'ml-2 text-xs text-slate-500'}>{overdue ? 'OVERDUE' : balance === 0 ? 'PAID' : 'OPEN'}</span></p>
                    <p className="text-xs text-slate-500">Issued {new Date(order.created_at).toLocaleDateString()} · Due {order.due_date ? new Date(`${order.due_date}T00:00:00`).toLocaleDateString() : '—'}</p>
                  </div>
                  <p className="text-sm">Total GHC {total.toFixed(2)} · Paid GHC {Number(order.amount_paid).toFixed(2)} · <span className="font-semibold">Balance GHC {balance.toFixed(2)}</span></p>
                </div>
                {order.payments && order.payments.length > 0 && (
                  <div className="mt-2 space-y-1 border-t pt-2 text-xs text-slate-500">
                    {order.payments.map((payment) => (
                      <p key={payment.id}>{new Date(payment.paid_at).toLocaleString()} · {payment.payment_method} · GHC {Number(payment.amount).toFixed(2)}{payment.received_by ? ` · ${payment.received_by}` : ''}</p>
                    ))}
                  </div>
                )}
                {balance > 0 && (
                  <div className="mt-3 flex flex-wrap items-end gap-2">
                    <div className="w-36">
                      <Label htmlFor={`payment-${order.id}`} className="text-xs">Record payment</Label>
                      <Input
                        id={`payment-${order.id}`}
                        type="number"
                        min="0.01"
                        max={balance.toFixed(2)}
                        step="0.01"
                        value={paymentDrafts[order.id] ?? ''}
                        onChange={(event) => setPaymentDrafts((drafts) => ({ ...drafts, [order.id]: event.target.value }))}
                        placeholder={`Max ${balance.toFixed(2)}`}
                      />
                    </div>
                    <select
                      aria-label={`Payment method for ${order.so_number}`}
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                      value={paymentMethods[order.id] || 'Cash'}
                      onChange={(event) => setPaymentMethods((methods) => ({ ...methods, [order.id]: event.target.value }))}
                    >
                      <option>Cash</option>
                      <option>Mobile Money</option>
                      <option>Bank Transfer</option>
                    </select>
                    <Button size="sm" onClick={() => void handleRecordPayment(order.id)} disabled={recordPayment.isPending}>Record payment</Button>
                  </div>
                )}
              </div>
            )
          })}
        </section>
      )}
    </div>
  )
}
