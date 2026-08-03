import { useForm, type FieldValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { returnSchema, type ReturnFormValues } from '../../lib/returnSchema'
import { useCreateReturn } from '../../hooks/useReturns'
import { useLocations } from '../../hooks/useLocations'
import { useSuppliers } from '../../hooks/useSuppliers'
import { RESOLUTION_OPTIONS_BY_TYPE, RESOLUTION_OPTION_DESCRIPTIONS, REASON_LABELS } from '../../types/returns'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function ReturnForm({ onClose }: { onClose: () => void }) {
  const { data: locations } = useLocations()
  const { data: suppliers } = useSuppliers()
  const createReturn = useCreateReturn()

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(returnSchema),
    defaultValues: { return_type: 'customer_return', reason: 'damaged' },
  })

  const returnType = watch('return_type') as ReturnFormValues['return_type']
  const locationId = watch('location_id')
  const supplierId = watch('supplier_id')
  const resolution = watch('resolution')
  const reason = watch('reason')

  const resolutionOptions = RESOLUTION_OPTIONS_BY_TYPE[returnType]

  async function onSubmit(values: FieldValues) {
    const typed = values as ReturnFormValues

    if (typed.return_type === 'customer_return' && !typed.customer_name?.trim()) {
      setError('customer_name', { type: 'manual', message: 'Customer name is required for customer returns' })
      return
    }
    if (typed.return_type === 'supplier_return' && !typed.supplier_id) {
      setError('supplier_id', { type: 'manual', message: 'Supplier is required for supplier returns' })
      return
    }
    await createReturn.mutateAsync(typed)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label className="mb-1 block">Return Type</Label>
        <Select
          value={returnType}
          onValueChange={(v) => {
            setValue('return_type', v as ReturnFormValues['return_type'])
            setValue('resolution', RESOLUTION_OPTIONS_BY_TYPE[v as ReturnFormValues['return_type']][0].value)
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="customer_return">Customer Return</SelectItem>
            <SelectItem value="damaged_stock">Damaged Stock (found in your inventory)</SelectItem>
            <SelectItem value="supplier_return">Supplier Return (sending back for credit)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="sku" className="mb-1 block">SKU</Label>
        <Input id="sku" {...register('sku')} />
        {errors.sku && <p className="text-red-600 text-sm mt-1">{errors.sku.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="quantity" className="mb-1 block">Quantity</Label>
          <Input id="quantity" type="number" step="0.01" {...register('quantity')} />
          {errors.quantity && <p className="text-red-600 text-sm mt-1">{errors.quantity.message}</p>}
        </div>
        <div>
          <Label htmlFor="unit_cost" className="mb-1 block">Unit Cost (optional)</Label>
          <Input id="unit_cost" type="number" step="0.01" {...register('unit_cost')} />
        </div>
      </div>

      <div>
        <Label className="mb-1 block">Location</Label>
        <Select value={locationId ?? ''} onValueChange={(v) => setValue('location_id', v ?? '')}>
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
        {errors.location_id && <p className="text-red-600 text-sm mt-1">{errors.location_id.message}</p>}
      </div>

      <div>
        <Label className="mb-1 block">Reason</Label>
        <Select value={reason} onValueChange={(v) => setValue('reason', v as ReturnFormValues['reason'])}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(REASON_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-1 block">Resolution</Label>
        <Select value={resolution} onValueChange={(v) => setValue('resolution', v as ReturnFormValues['resolution'])}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {resolutionOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {resolution && (
          <p className="mt-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
            {RESOLUTION_OPTION_DESCRIPTIONS[resolution]}
          </p>
        )}
      </div>

      {returnType === 'customer_return' && (
        <div>
          <Label htmlFor="customer_name" className="mb-1 block">Customer Name</Label>
          <Input id="customer_name" placeholder="e.g. Jane Doe" {...register('customer_name')} />
          {errors.customer_name && <p className="text-red-600 text-sm mt-1">{errors.customer_name.message}</p>}
        </div>
      )}

      {returnType === 'supplier_return' && (
        <div>
          <Label className="mb-1 block">Supplier</Label>
          <Select value={supplierId ?? ''} onValueChange={(v) => setValue('supplier_id', v ?? '')}>
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
          {errors.supplier_id && <p className="text-red-600 text-sm mt-1">{errors.supplier_id.message}</p>}
        </div>
      )}

      <div>
        <Label htmlFor="notes" className="mb-1 block">Notes</Label>
        <Input id="notes" {...register('notes')} />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Logging...' : 'Log Return'}
        </Button>
      </div>
    </form>
  )
}

