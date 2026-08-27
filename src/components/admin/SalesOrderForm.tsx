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
  salesOrderSchema,
  type SalesOrderFormValues,
  type SalesOrderFormInput,
} from '../../lib/procurementSchemas'

type SalesOrderFormProps = {
  onClose: () => void
}

export default function SalesOrderForm({ onClose }: SalesOrderFormProps) {
  const createSO = useCreateSalesOrder()
  const { data: inventoryItems = [] } = useInventory()

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SalesOrderFormInput, unknown, SalesOrderFormValues>({
    resolver: zodResolver(salesOrderSchema),
    defaultValues: {
      so_number: `SO-${Date.now().toString().slice(-8)}`,
      notes: '',
      items: [{ sku: '', quantity_ordered: 1, unit_price: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const items = watch('items')

  const total = items.reduce((sum, item) => {
    const qty = Number(item.quantity_ordered) || 0
    const price = Number(item.unit_price) || 0
    return sum + qty * price
  }, 0)

  function handlePickInventoryItem(index: number, inventoryItemId: string) {
    const item = inventoryItems.find((i) => String(i.id) === inventoryItemId)
    if (!item) return
    setValue(`items.${index}.inventory_item_id`, item.id)
    setValue(`items.${index}.sku`, item.sku)
    if (item.unit_price != null) {
      setValue(`items.${index}.unit_price`, item.unit_price)
    }
  }

  async function onSubmit(values: SalesOrderFormValues) {
    try {
      await createSO.mutateAsync({
        so_number: values.so_number,
        notes: values.notes || undefined,
        items: values.items.map((item) => ({
          sku: item.sku,
          inventory_item_id: item.inventory_item_id,
          quantity_ordered: item.quantity_ordered,
          unit_price: item.unit_price,
          currency: 'GHS',
        })),
      })
      toast.success(`SO #${values.so_number} created`)
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      toast.error(`Failed to create sales order: ${message}`)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="so-number" className="mb-1 block">SO number</Label>
        <Input id="so-number" {...register('so_number')} />
        {errors.so_number && <p className="text-red-600 text-sm mt-1">{errors.so_number.message}</p>}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="block">Line items</Label>
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
                <Input
                  type="number"
                  min="1"
                  step="1"
                  {...register(`items.${index}.quantity_ordered`)}
                />
                {errors.items?.[index]?.quantity_ordered && (
                  <p className="text-red-600 text-xs mt-1">{errors.items[index]?.quantity_ordered?.message}</p>
                )}
              </div>
              <div>
                <Label className="mb-1 block text-xs">Unit price</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  {...register(`items.${index}.unit_price`)}
                />
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
        <Label htmlFor="so-notes" className="mb-1 block">Notes</Label>
        <Input id="so-notes" {...register('notes')} placeholder="Optional" />
      </div>

      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-600">Order total</p>
        <p className="mt-1 text-lg font-semibold text-slate-900">GHS {total.toFixed(2)}</p>
      </div>

      <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Sales Order'}
      </Button>
    </form>
  )
}