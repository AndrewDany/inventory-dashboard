import { useState, lazy, Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ScanLine } from 'lucide-react'
import { inventoryItemSchema, type InventoryFormValues } from '../../lib/schemas'
import { useAddInventoryItem, useUpdateInventoryItem } from '../../hooks/useInventory'
import { useLocations } from '../../hooks/useLocations'
import { useSuppliers } from '../../hooks/useSuppliers'
const BarcodeScanner = lazy(() => import('./BarcodeScanner'))
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { InventoryItem } from '../../types/inventory'

const UNIT_TYPE_LABELS: Record<string, string> = {
  unit: 'Unit (piece, bag, item)',
  box: 'Box',
  weight: 'Weight',
}

export default function InventoryForm({
  onClose,
  item,
}: {
  onClose: () => void
  item?: InventoryItem
}) {
  const [showScanner, setShowScanner] = useState(false)
  const { data: locations } = useLocations()
  const { data: suppliers } = useSuppliers()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryItemSchema) as any,
    defaultValues: item
      ? {
          name: item.name,
          sku: item.sku,
          category: item.category ?? '',
          // Legacy rows may still carry the old 'measured' type or 'm'
          // (meters) unit before the box/weight/unit split — normalize
          // them so the form doesn't render an unknown option.
          unit_type:
            (item.unit_type as string) === 'measured' ? 'weight' : item.unit_type,
          unit_of_measure: item.unit_of_measure === 'kg' ? 'kg' : null,
          units_per_box: item.units_per_box ?? null,
          quantity: item.quantity,
          reorder_level: item.reorder_level,
          unit_price: item.unit_price ?? undefined,
          supplier: item.supplier ?? '',
          location_id: item.location_id ?? undefined,
        }
      : {
          name: '',
          sku: '',
          category: '',
          quantity: 0,
          reorder_level: 0,
          unit_price: undefined,
          supplier: '',
          location_id: undefined,
          unit_type: 'unit',
          unit_of_measure: null,
          units_per_box: null,
        },
  })

  const addItem = useAddInventoryItem()
  const updateItem = useUpdateInventoryItem()
  const isEditMode = Boolean(item)
  const locationValue = watch('location_id')
  const unitTypeValue = watch('unit_type')
  const unitOfMeasureValue = watch('unit_of_measure')
  const unitsPerBoxValue = watch('units_per_box')
  const supplierValue = watch('supplier')
  const isWeight = unitTypeValue === 'weight'
  const isBox = unitTypeValue === 'box'
  const hasBoxConversion = isBox && Boolean(unitsPerBoxValue)

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
        <Suspense fallback={null}>
          <BarcodeScanner
            onClose={() => setShowScanner(false)}
            onScan={(code) => {
              setValue('sku', code)
              setShowScanner(false)
            }}
          />
        </Suspense>
      )}

      <div>
        <Label className="mb-1 block">Location</Label>
        <Select
          value={locationValue ?? ''}
          onValueChange={(v) => setValue('location_id', v || undefined)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a location">
              {(value: string) => locations?.find((loc) => loc.id === value)?.name ?? value}
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

      <div>
        <Label htmlFor="category" className="mb-1 block">Category</Label>
        <Input id="category" {...register('category')} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="mb-1 block">Sold By</Label>
          <Select
            value={unitTypeValue ?? 'unit'}
            onValueChange={(v) => {
              setValue('unit_type', (v as 'unit' | 'box' | 'weight') ?? 'unit')
              if (v !== 'weight') {
                setValue('unit_of_measure', null)
              } else if (!unitOfMeasureValue) {
                setValue('unit_of_measure', 'kg')
              }
              if (v !== 'box') {
                setValue('units_per_box', null)
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select how this is sold">
                {(value: string) => UNIT_TYPE_LABELS[value] ?? value}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unit">Unit (piece, bag, item)</SelectItem>
              <SelectItem value="box">Box</SelectItem>
              <SelectItem value="weight">Weight</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isWeight && (
          <div>
            <Label className="mb-1 block">Unit of Measure</Label>
            <Select
              value={unitOfMeasureValue ?? 'kg'}
              onValueChange={(v) => setValue('unit_of_measure', (v as 'kg') ?? 'kg')}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">Kilograms (kg)</SelectItem>
              </SelectContent>
            </Select>
            {errors.unit_of_measure && (
              <p className="text-red-600 text-sm mt-1">{errors.unit_of_measure.message}</p>
            )}
          </div>
        )}
      </div>

      {isBox && (
        <div>
          <Label htmlFor="units_per_box" className="mb-1 block">
            Units per Box (optional)
          </Label>
          <Input
            id="units_per_box"
            type="number"
            step="1"
            min="1"
            placeholder="e.g. 100"
            {...register('units_per_box')}
          />
          <p className="text-xs text-gray-500 mt-1">
            {hasBoxConversion
              ? `This box can be sold whole or broken open and sold as individual pieces. Stock below is tracked in pieces (${unitsPerBoxValue} per box).`
              : 'Leave blank if you only ever sell this sealed — stock will be tracked in whole boxes. Set a number if boxes get opened and sold as loose pieces too.'}
          </p>
          {errors.units_per_box && (
            <p className="text-red-600 text-sm mt-1">{errors.units_per_box.message}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="quantity" className="mb-1 block">
            Quantity {isWeight && unitOfMeasureValue ? `(${unitOfMeasureValue})` : ''}
            {isBox ? (hasBoxConversion ? '(pieces)' : '(boxes)') : ''}
          </Label>
          <Input
            id="quantity"
            type="number"
            step={isWeight ? '0.01' : '1'}
            {...register('quantity')}
          />
          {errors.quantity && <p className="text-red-600 text-sm mt-1">{errors.quantity.message}</p>}
        </div>

        <div>
          <Label htmlFor="reorder_level" className="mb-1 block">
            Reorder Level {isWeight && unitOfMeasureValue ? `(${unitOfMeasureValue})` : ''}
            {isBox ? (hasBoxConversion ? '(pieces)' : '(boxes)') : ''}
          </Label>
          <Input
            id="reorder_level"
            type="number"
            step={isWeight ? '0.01' : '1'}
            {...register('reorder_level')}
          />
          {errors.reorder_level && <p className="text-red-600 text-sm mt-1">{errors.reorder_level.message}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="unit_price" className="mb-1 block">
          Unit Price {isWeight && unitOfMeasureValue ? `(per ${unitOfMeasureValue})` : unitTypeValue === 'box' ? '(per box)' : ''}
        </Label>
        <Input id="unit_price" type="number" step="0.01" {...register('unit_price')} />
        {errors.unit_price && <p className="text-red-600 text-sm mt-1">{errors.unit_price.message}</p>}
      </div>

      <div>
        <Label className="mb-1 block">Supplier</Label>
        <Select
          value={supplierValue ?? ''}
          onValueChange={(v) => setValue('supplier', v || '')}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a supplier (optional)" />
          </SelectTrigger>
          <SelectContent>
            {suppliers?.map((s) => (
              <SelectItem key={s.id} value={s.name}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(!suppliers || suppliers.length === 0) && (
          <p className="text-xs text-gray-500 mt-1">
            No suppliers yet — add one under Admin Panel → Suppliers first.
          </p>
        )}
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