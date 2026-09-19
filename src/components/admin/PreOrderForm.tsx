import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateSalesOrder } from '../../hooks/useSalesOrders'
import { useInventory } from '../../hooks/useInventory'
import {
  preOrderSchema,
  type PreOrderFormValues,
  type PreOrderFormInput,
} from '../../lib/procurementSchemas'

type PreOrderFormProps = {
  onClose: () => void
}

export default function PreOrderForm({ onClose }: PreOrderFormProps) {
  const createSO = useCreateSalesOrder()
  const { data: inventoryItems = [] } = useInventory()

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PreOrderFormInput, unknown, PreOrderFormValues>({
    resolver: zodResolver(preOrderSchema),
    defaultValues: {
      so_number: `PRE-${Date.now().toString().slice(-8)}`,
      customer_name: '',
      customer_phone: '',
      fulfillment_method: 'pickup',
      delivery_address: '',
      deposit_amount: 0,
      notes: '',
      items: [{ sku: '', quantity_ordered: 1, unit_price: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const items = watch('items')
  const fulfillmentMethod = watch('fulfillment_method')
  const depositAmount = watch('deposit_amount')

  const total = items.reduce((sum, item) => {
    const qty = Number(item.quantity_ordered) || 0
    const price = Number(item.unit_price) || 0
    return sum + qty * price
  }, 0)
  const balanceDue = Math.max(0, total - (Number(depositAmount) || 0))

  function handlePickInventoryItem(index: number, inventoryItemId: string) {
    const item = inventoryItems.find((i) => String(i.id) === inventoryItemId)
    if (!item) return
    setValue(`items.${index}.inventory_item_id`, item.id)
    setValue(`items.${index}.sku`, item.sku)
    if (item.unit_price != null) {
      setValue(`items.${index}.unit_price`, item.unit_price)
    }
  }

  async function onSubmit(values: PreOrderFormValues) {
    try {
      await createSO.mutateAsync({
        so_number: values.so_number,
        notes: values.notes || undefined,
        customer_name: values.customer_name,
        customer_phone: values.customer_phone,
        is_preorder: true,
        fulfillment_method: values.fulfillment_method,
        delivery_address: values.fulfillment_method === 'delivery' ? values.delivery_address : undefined,
        deposit_amount: values.deposit_amount || 0,
        items: values.items.map((item) => ({
          sku: item.sku,
          inventory_item_id: item.inventory_item_id,
          quantity_ordered: item.quantity_ordered,
          unit_price: item.unit_price,
          currency: 'GHS',
        })),
      })
      toast.success(`Pre-order #${values.so_number} saved`)
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      toast.error(`Failed to save pre-order: ${message}`)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="preorder-number" className="mb-1 block">Order number</Label>
        <Input id="preorder-number" {...register('so_number')} />
        {errors.so_number && <p className="text-red-600 text-sm mt-1">{errors.so_number.message}</p>}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label htmlFor="customer-name" className="mb-1 block">Client name</Label>
          <Input id="customer-name" {...register('customer_name')} placeholder="Who called" />
          {errors.customer_name && <p className="text-red-600 text-sm mt-1">{errors.customer_name.message}</p>}
        </div>
        <div>
          <Label htmlFor="customer-phone" className="mb-1 block">Phone number</Label>
          <Input id="customer-phone" {...register('customer_phone')} placeholder="For pickup/delivery contact" />
          {errors.customer_phone && <p className="text-red-600 text-sm mt-1">{errors.customer_phone.message}</p>}
        </div>
      </div>

      <div>
        <Label className="mb-1 block">How will they get it?</Label>
        <Select
          value={fulfillmentMethod}
          onValueChange={(v) => setValue('fulfillment_method', v as 'pickup' | 'delivery')}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pickup">Client will pick up</SelectItem>
            <SelectItem value="delivery">Deliver to client</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {fulfillmentMethod === 'delivery' && (
        <div>
          <Label htmlFor="delivery-address" className="mb-1 block">Delivery address</Label>
          <Input id="delivery-address" {...register('delivery_address')} placeholder="Where to deliver" />
          {errors.delivery_address && (
            <p className="text-red-600 text-sm mt-1">{errors.delivery_address.message}</p>
          )}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="block">Items ordered</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ sku: '', quantity_ordered: 1, unit_price: 0 })}
          >
            + Add line
          </Button>
        </div>

        {fields.map((field, index) => (
          <div key={field.id} className="rounded-xl border border-slate-200 p-3 space-y-3">
            <div>
              <Label className="mb-1 block text-xs">Inventory item</Label>
              <Select
                value={items[index]?.inventory_item_id != null ? String(items[index].inventory_item_id) : ''}
                onValueChange={(v) => handlePickInventoryItem(index, v as string)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pick an existing item">
                    {(value: string) => {
                      const picked = inventoryItems.find((i) => String(i.id) === value)
                      return picked ? `${picked.name} (${picked.sku}) — ${picked.quantity} on hand` : undefined
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {inventoryItems.map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {item.name} ({item.sku}) — {item.quantity} on hand
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <Label className="mb-1 block text-xs">SKU</Label>
                <Input {...register(`items.${index}.sku`)} readOnly className="bg-slate-50" />
                {errors.items?.[index]?.sku && (
                  <p className="text-red-600 text-xs mt-1">{errors.items[index]?.sku?.message}</p>
                )}
              </div>
              <div>
                <Label className="mb-1 block text-xs">Quantity</Label>
                <Input type="number" min="1" step="1" {...register(`items.${index}.quantity_ordered`)} />
                {errors.items?.[index]?.quantity_ordered && (
                  <p className="text-red-600 text-xs mt-1">{errors.items[index]?.quantity_ordered?.message}</p>
                )}
              </div>
              <div>
                <Label className="mb-1 block text-xs">Unit price</Label>
                <Input type="number" min="0" step="0.01" {...register(`items.${index}.unit_price`)} />
              </div>
            </div>

            {fields.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700"
                onClick={() => remove(index)}
              >
                Remove line
              </Button>
            )}
          </div>
        ))}
        {errors.items && !Array.isArray(errors.items) && (
          <p className="text-red-600 text-sm">{errors.items.message as string}</p>
        )}
      </div>

      <div>
        <Label htmlFor="deposit-amount" className="mb-1 block">Deposit collected now (optional)</Label>
        <Input id="deposit-amount" type="number" min="0" step="0.01" {...register('deposit_amount')} placeholder="0.00" />
        <p className="text-xs text-gray-500 mt-1">Leave at 0 if they're paying everything later.</p>
      </div>

      <div>
        <Label htmlFor="preorder-notes" className="mb-1 block">Notes</Label>
        <Input id="preorder-notes" {...register('notes')} placeholder="Optional" />
      </div>

      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3 space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-amber-700">Order total</span>
          <span className="font-semibold text-slate-900">GHS {total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-amber-700">Deposit collected</span>
          <span className="text-slate-700">GHS {(Number(depositAmount) || 0).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm border-t border-amber-200 pt-1 mt-1">
          <span className="font-medium text-amber-800">Balance due</span>
          <span className="font-semibold text-slate-900">GHS {balanceDue.toFixed(2)}</span>
        </div>
      </div>

      <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save Pre-Order'}
      </Button>
    </form>
  )
}
