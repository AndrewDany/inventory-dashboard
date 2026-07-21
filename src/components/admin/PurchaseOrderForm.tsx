import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2, Plus } from 'lucide-react'
import { purchaseOrderSchema, type PurchaseOrderFormValues } from '../../lib/procurementSchemas'
import { useCreatePurchaseOrder } from '../../hooks/usePurchaseOrders'
import { useSuppliers } from '../../hooks/useSuppliers'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function PurchaseOrderForm({ onClose }: { onClose: () => void }) {
  const { data: suppliers } = useSuppliers()
  const createPO = useCreatePurchaseOrder()

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      po_number: `PO-${Date.now().toString().slice(-6)}`,
      items: [{ sku: '', quantity_ordered: 1 }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const supplierValue = watch('supplier_id')

  async function onSubmit(values: PurchaseOrderFormValues) {
    await createPO.mutateAsync(values)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="po_number" className="mb-1 block">PO Number</Label>
        <Input id="po_number" {...register('po_number')} />
        {errors.po_number && <p className="text-red-600 text-sm mt-1">{errors.po_number.message}</p>}
      </div>

      <div>
        <Label className="mb-1 block">Supplier</Label>
        <Select value={supplierValue ?? ''} onValueChange={(v) => setValue('supplier_id', v)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a supplier" />
          </SelectTrigger>
          <SelectContent>
            {suppliers?.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="notes" className="mb-1 block">Notes</Label>
        <Input id="notes" {...register('notes')} />
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <Label>Line Items</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ sku: '', quantity_ordered: 1 })}
          >
            <Plus size={14} className="mr-1" /> Add Line
          </Button>
        </div>

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-12 gap-2 items-start border border-gray-100 rounded-lg p-3">
              <div className="col-span-5">
                <Input placeholder="SKU" {...register(`items.${index}.sku`)} />
                {errors.items?.[index]?.sku && (
                  <p className="text-red-600 text-xs mt-1">{errors.items[index]?.sku?.message}</p>
                )}
              </div>
              <div className="col-span-3">
                <Input
                  type="number"
                  placeholder="Qty"
                  {...register(`items.${index}.quantity_ordered`)}
                />
                {errors.items?.[index]?.quantity_ordered && (
                  <p className="text-red-600 text-xs mt-1">{errors.items[index]?.quantity_ordered?.message}</p>
                )}
              </div>
              <div className="col-span-3">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Unit cost"
                  {...register(`items.${index}.unit_cost`)}
                />
              </div>
              <div className="col-span-1 flex justify-center pt-2">
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        {errors.items?.root && <p className="text-red-600 text-sm mt-2">{errors.items.root.message}</p>}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Purchase Order'}
        </Button>
      </div>
    </form>
  )
}