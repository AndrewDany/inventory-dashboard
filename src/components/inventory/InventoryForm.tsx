import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ScanLine } from 'lucide-react'
import { inventoryItemSchema, type InventoryFormValues } from '../../lib/schemas'
import { useAddInventoryItem, useUpdateInventoryItem } from '../../hooks/useInventory'
import { useLocations } from '../../hooks/useLocations'
import BarcodeScanner from './BarcodeScanner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { InventoryItem } from '../../types/inventory'

export default function InventoryForm({
  onClose,
  item,
}: {
  onClose: () => void
  item?: InventoryItem
}) {
  const [showScanner, setShowScanner] = useState(false)
  const { data: locations } = useLocations()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: item
      ? {
          name: item.name,
          sku: item.sku,
          category: item.category ?? '',
          quantity: item.quantity,
          reorder_level: item.reorder_level,
          unit_price: item.unit_price ?? undefined,
          supplier: item.supplier ?? '',
          location_id: item.location_id ?? undefined,
        }
      : undefined,
  })

  const addItem = useAddInventoryItem()
  const updateItem = useUpdateInventoryItem()
  const isEditMode = Boolean(item)
  const locationValue = watch('location_id')

  async function onSubmit(values: InventoryFormValues) {
    if (isEditMode && item) {
      await updateItem.mutateAsync({ id: item.id, values, previousQuantity: item.quantity })
    } else {
      await addItem.mutateAsync(values)
    }
    onClose()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name" className="mb-1 block">Name</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="sku" className="mb-1 block">SKU</Label>
        <div className="flex gap-2">
          <Input id="sku" {...register('sku')} className="flex-1" />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowScanner(true)}
            title="Scan barcode"
          >
            <ScanLine size={18} />
          </Button>
        </div>
        {errors.sku && <p className="text-red-600 text-sm mt-1">{errors.sku.message}</p>}
      </div>

      {showScanner && (
        <BarcodeScanner
          onClose={() => setShowScanner(false)}
          onScan={(code) => {
            setValue('sku', code)
            setShowScanner(false)
          }}
        />
      )}

      <div>
        <Label className="mb-1 block">Location</Label>
        <Select
          value={locationValue ?? ''}
          onValueChange={(v) => setValue('location_id', v)}
        >
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

      <div>
        <Label htmlFor="category" className="mb-1 block">Category</Label>
        <Input id="category" {...register('category')} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="quantity" className="mb-1 block">Quantity</Label>
          <Input id="quantity" type="number" {...register('quantity')} />
          {errors.quantity && <p className="text-red-600 text-sm mt-1">{errors.quantity.message}</p>}
        </div>

        <div>
          <Label htmlFor="reorder_level" className="mb-1 block">Reorder Level</Label>
          <Input id="reorder_level" type="number" {...register('reorder_level')} />
          {errors.reorder_level && <p className="text-red-600 text-sm mt-1">{errors.reorder_level.message}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="unit_price" className="mb-1 block">Unit Price</Label>
        <Input id="unit_price" type="number" step="0.01" {...register('unit_price')} />
        {errors.unit_price && <p className="text-red-600 text-sm mt-1">{errors.unit_price.message}</p>}
      </div>

      <div>
        <Label htmlFor="supplier" className="mb-1 block">Supplier</Label>
        <Input id="supplier" {...register('supplier')} />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Add Item'}
        </Button>
      </div>
    </form>
  )
}