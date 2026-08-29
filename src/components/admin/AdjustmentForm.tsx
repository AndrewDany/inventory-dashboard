import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { adjustmentSchema, type AdjustmentFormValues } from '../../lib/procurementSchemas'
import { useApplyInventoryAdjustment } from '../../hooks/useInventoryAdjustments'
import { useLocations } from '../../hooks/useLocations'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function AdjustmentForm({ onClose }: { onClose: () => void }) {
  const applyAdjustment = useApplyInventoryAdjustment()
  const { data: locations } = useLocations()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      sku: '',
      location_id: '',
      quantity_delta: 0,
      reason: 'manual_add' as const,
      notes: '',
    },
  })

  const reason = watch('reason')
  const locationId = watch('location_id')

  async function onSubmit(values: Record<string, any>) {
    await applyAdjustment.mutateAsync({
      inventory_item_id: null,
      sku: values.sku,
      location_id: values.location_id,
      quantity_delta: values.quantity_delta,
      reason: values.reason,
      notes: values.notes,
    })
    onClose()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="sku" className="mb-1 block">SKU</Label>
        <Input id="sku" {...register('sku')} placeholder="e.g. ITEM-001" />
        {errors.sku && <p className="text-red-600 text-sm mt-1">{errors.sku.message}</p>}
      </div>

      <div>
      <Label className="mb-1 block">Location</Label>
        <Select
          value={locationId ?? ''}
          onValueChange={(v) => setValue('location_id', v ?? '')}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a location">
              {locationId ? (locations?.find((loc) => loc.id === locationId)?.name ?? locationId) : undefined}
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
        {errors.location_id && <p className="text-red-600 text-sm mt-1">{errors.location_id.message}</p>}
      </div>

      <div>
        <Label htmlFor="quantity_delta" className="mb-1 block">Quantity Change (+/-)</Label>
        <Input
          id="quantity_delta"
          type="number"
          {...register('quantity_delta', { valueAsNumber: true })}
          placeholder="e.g. 10 or -5"
        />
        {errors.quantity_delta && <p className="text-red-600 text-sm mt-1">{errors.quantity_delta.message}</p>}
      </div>

      <div>
        <Label className="mb-1 block">Reason</Label>
        <Select value={reason} onValueChange={(v) => setValue('reason', v as AdjustmentFormValues['reason'])}>
          <SelectTrigger className="w-full">
            <SelectValue>
              {reason === 'manual_add' ? 'Manual Add' :
               reason === 'manual_remove' ? 'Manual Remove' :
               reason === 'cycle_count' ? 'Cycle Count' :
               reason === 'write_off' ? 'Write Off' :
               reason === 'other' ? 'Other' : undefined}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual_add">Manual Add</SelectItem>
            <SelectItem value="manual_remove">Manual Remove</SelectItem>
            <SelectItem value="cycle_count">Cycle Count</SelectItem>
            <SelectItem value="write_off">Write Off</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        {errors.reason && <p className="text-red-600 text-sm mt-1">{errors.reason.message}</p>}
      </div>

      <div>
        <Label htmlFor="notes" className="mb-1 block">Notes (optional)</Label>
        <Input id="notes" {...register('notes')} placeholder="Reason for adjustment" />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Applying...' : 'Apply Adjustment'}
        </Button>
      </div>
    </form>
  )
}

