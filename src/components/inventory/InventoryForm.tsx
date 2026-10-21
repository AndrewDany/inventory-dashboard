import { useEffect, useState, lazy, Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ImagePlus, ScanLine, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { inventoryItemSchema, type InventoryFormValues } from '../../lib/schemas'
import { useAddInventoryItem, useUpdateInventoryItem } from '../../hooks/useInventory'
import { useLocations } from '../../hooks/useLocations'
import { useSuppliers } from '../../hooks/useSuppliers'
import { api } from '../../lib/apiClient'
const BarcodeScanner = lazy(() => import('./BarcodeScanner'))
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { InventoryItem } from '../../types/inventory'

const UNIT_TYPE_LABELS: Record<string, string> = {
  unit: 'Unit (piece, bag, item)',
  box: 'Box',
  weight: 'Measured quantity',
}

export default function InventoryForm({
  onClose,
  item,
  mode = 'unit',
}: {
  onClose: () => void
  item?: InventoryItem
  mode?: 'unit' | 'yard' | 'bundle'
}) {
  const [showScanner, setShowScanner] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(item?.image_url ?? null)
  const [removeImage, setRemoveImage] = useState(false)
  const { data: locations } = useLocations()
  const { data: suppliers } = useSuppliers()
  const queryClient = useQueryClient()

  useEffect(() => () => {
    if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
  }, [imagePreview])

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryItemSchema) as any,
    defaultValues: item
      ? {
          name: item.name,
          sku: item.sku,
          category: item.category ?? '',
          type: item.type ?? '',
          brand: item.brand ?? '',
          color: item.color ?? '',
          size: item.size ?? '',
          // Legacy rows may still carry the old 'measured' type or 'm'
          // (meters) unit before the box/weight/unit split — normalize
          // them so the form doesn't render an unknown option.
          unit_type:
            (item.unit_type as string) === 'measured' ? 'weight' : item.unit_type,
          unit_of_measure: item.unit_of_measure === 'kg' || item.unit_of_measure === 'yard' ? item.unit_of_measure : null,
          units_per_box: item.units_per_box ?? null,
          unit_cost: item.unit_cost ?? undefined,
          bundle_yards: item.bundle_yards ?? null,
          bundle_price: item.bundle_price ?? null,
          bundle_cost: item.bundle_cost ?? null,
          cut_size_mm: item.cut_size_mm ?? null,
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
          type: '',
          brand: '',
          color: '',
          size: '',
          quantity: 0,
          reorder_level: 0,
          unit_price: undefined,
          unit_cost: undefined,
          supplier: '',
          location_id: undefined,
          unit_type: mode === 'unit' ? 'unit' : 'weight',
          unit_of_measure: mode === 'unit' ? null : 'yard',
          units_per_box: null,
          bundle_yards: null,
          bundle_price: null,
          bundle_cost: null,
          cut_size_mm: null,
        },
  })

  const addItem = useAddInventoryItem()
  const updateItem = useUpdateInventoryItem()
  const isEditMode = Boolean(item)
  const isBundleMode = !isEditMode && mode === 'bundle'
  const isYardMode = !isEditMode && mode === 'yard'
  const locationValue = watch('location_id')
  const unitTypeValue = watch('unit_type')
  const unitOfMeasureValue = watch('unit_of_measure')
  const unitsPerBoxValue = watch('units_per_box')
  const supplierValue = watch('supplier')
  const isWeight = unitTypeValue === 'weight'
  const isBox = unitTypeValue === 'box'
  const hasBoxConversion = isBox && Boolean(unitsPerBoxValue)

  async function onSubmit(values: InventoryFormValues) {
    if (isBundleMode) {
      const yardsPerBundle = Number(values.bundle_yards)
      if (!Number.isFinite(yardsPerBundle) || yardsPerBundle <= 0) {
        setError('bundle_yards', { type: 'validate', message: 'Enter a bundle size greater than 0' })
        return
      }
      if (values.bundle_price == null) {
        setError('bundle_price', { type: 'validate', message: 'Bundle price is required' })
        return
      }

      values = {
        ...values,
        quantity: values.quantity * yardsPerBundle,
        reorder_level: values.reorder_level * yardsPerBundle,
        unit_cost: values.bundle_cost == null ? undefined : Number(values.bundle_cost) / yardsPerBundle,
        unit_price: Number(values.bundle_price) / yardsPerBundle,
      }
    }

    let savedItemId = item?.id
    if (isEditMode && item) {
      await updateItem.mutateAsync({ id: item.id, values, previousQuantity: item.quantity })
    } else {
      const createdItem = await addItem.mutateAsync(values)
      savedItemId = createdItem.id
    }

    try {
      if (imageFile && savedItemId) {
        const formData = new FormData()
        formData.append('image', imageFile)
        await api.post(`/inventory/${savedItemId}/image`, formData)
      } else if (removeImage && savedItemId) {
        await api.delete(`/inventory/${savedItemId}/image`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown upload error'
      toast.error(`Product saved, but its image could not be updated: ${message}`)
    }

    if (imageFile || removeImage) {
      await queryClient.invalidateQueries({ queryKey: ['inventory_items'] })
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
        <Label htmlFor="product-image" className="mb-1 block">Product Image</Label>
        <div className="flex items-center gap-3">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded border border-slate-200 bg-slate-50">
            {imagePreview && !removeImage ? (
              <img src={imagePreview} alt="Product preview" className="h-full w-full object-cover" />
            ) : (
              <ImagePlus size={22} className="text-slate-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <Input
              id="product-image"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (!file) return
                setImageFile(file)
                setImagePreview(URL.createObjectURL(file))
                setRemoveImage(false)
              }}
              className="h-auto cursor-pointer py-2 text-xs"
            />
            <p className="mt-1 text-xs text-slate-500">JPG, PNG, WebP, or GIF; up to 5 MB.</p>
            {imagePreview && !removeImage && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-1 h-7 px-2 text-xs text-slate-600"
                onClick={() => {
                  setImageFile(null)
                  setImagePreview(null)
                  setRemoveImage(true)
                }}
              >
                <X size={13} />
                Remove image
              </Button>
            )}
          </div>
        </div>
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
          <Label htmlFor="brand" className="mb-1 block">Brand</Label>
          <Input id="brand" {...register('brand')} placeholder="e.g. Dulux, Bosch" />
        </div>
        <div>
          <Label htmlFor="type" className="mb-1 block">Type</Label>
          <Input id="type" {...register('type')} placeholder="e.g. Enamel, Gloss" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="color" className="mb-1 block">Color</Label>
          <Input id="color" {...register('color')} placeholder="e.g. White, Blue" />
        </div>
        <div>
          <Label htmlFor="size" className="mb-1 block">Size</Label>
          <Input id="size" {...register('size')} placeholder="e.g. 5L, XL, 10mm" />
        </div>
      </div>

      {!isYardMode && !isBundleMode && (
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
              <SelectItem value="weight">Measured quantity</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isWeight && (
          <div>
            <Label className="mb-1 block">Unit of Measure</Label>
            <Select
              value={unitOfMeasureValue ?? 'kg'}
              onValueChange={(v) => setValue('unit_of_measure', (v as 'kg' | 'yard') ?? 'kg')}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">Kilograms (kg)</SelectItem>
                <SelectItem value="yard">Yards (yd)</SelectItem>
              </SelectContent>
            </Select>
            {errors.unit_of_measure && (
              <p className="text-red-600 text-sm mt-1">{errors.unit_of_measure.message}</p>
            )}
          </div>
        )}
      </div>
      )}

      {unitOfMeasureValue === 'yard' && !isYardMode && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <Label htmlFor="bundle_yards" className="mb-1 block">Bundle (yards)</Label>
            <Input id="bundle_yards" type="number" min="0.01" step="0.01" required={isBundleMode} {...register('bundle_yards')} />
          </div>
          <div>
            <Label htmlFor="bundle_price" className="mb-1 block">Bundle Price (GHC)</Label>
            <Input id="bundle_price" type="number" min="0" step="0.01" required={isBundleMode} {...register('bundle_price')} />
          </div>
          <div>
            <Label htmlFor="bundle_cost" className="mb-1 block">Bundle Cost (GHC)</Label>
            <Input id="bundle_cost" type="number" min="0" step="0.01" {...register('bundle_cost')} />
          </div>
          {!isBundleMode && (
            <div>
              <Label htmlFor="cut_size_mm" className="mb-1 block">Cut Length (mm)</Label>
              <Input id="cut_size_mm" type="number" min="0" step="0.01" {...register('cut_size_mm')} />
            </div>
          )}
        </div>
      )}

      {(isYardMode || isBundleMode) && (
        <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          Stock tracked in yards
        </div>
      )}

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
            Quantity {isBundleMode ? '(bundles)' : isYardMode ? '(yards)' : isWeight && unitOfMeasureValue ? `(${unitOfMeasureValue})` : ''}
            {isBox ? (hasBoxConversion ? '(pieces)' : '(boxes)') : ''}
          </Label>
          <Input
            id="quantity"
            type="number"
            step={isBundleMode ? '1' : unitOfMeasureValue === 'yard' ? '0.000001' : isWeight ? '0.01' : '1'}
            {...register('quantity')}
          />
          {errors.quantity && <p className="text-red-600 text-sm mt-1">{errors.quantity.message}</p>}
        </div>

        <div>
          <Label htmlFor="reorder_level" className="mb-1 block">
            Reorder Level {isBundleMode ? '(bundles)' : isYardMode ? '(yards)' : isWeight && unitOfMeasureValue ? `(${unitOfMeasureValue})` : ''}
            {isBox ? (hasBoxConversion ? '(pieces)' : '(boxes)') : ''}
          </Label>
          <Input
            id="reorder_level"
            type="number"
            step={isBundleMode ? '1' : unitOfMeasureValue === 'yard' ? '0.000001' : isWeight ? '0.01' : '1'}
            {...register('reorder_level')}
          />
          {errors.reorder_level && <p className="text-red-600 text-sm mt-1">{errors.reorder_level.message}</p>}
        </div>
      </div>

      {isBundleMode && (
        <p className="text-xs text-gray-500 -mt-2">
          Opening stock and reorder levels are entered in bundles and saved as yards.
        </p>
      )}

      {!isBundleMode && <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="unit_cost" className="mb-1 block">
            Unit Cost {isWeight && unitOfMeasureValue ? `(per ${unitOfMeasureValue})` : unitTypeValue === 'box' ? '(per box)' : ''}
          </Label>
          <Input id="unit_cost" type="number" step="0.01" {...register('unit_cost')} placeholder="What you paid" />
          {errors.unit_cost && <p className="text-red-600 text-sm mt-1">{errors.unit_cost.message}</p>}
        </div>
        <div>
          <Label htmlFor="unit_price" className="mb-1 block">
            Unit Price {isWeight && unitOfMeasureValue ? `(per ${unitOfMeasureValue})` : unitTypeValue === 'box' ? '(per box)' : ''}
          </Label>
          <Input id="unit_price" type="number" step="0.01" {...register('unit_price')} placeholder="What you sell for" />
          {errors.unit_price && <p className="text-red-600 text-sm mt-1">{errors.unit_price.message}</p>}
        </div>
      </div>}
      <p className="text-xs text-gray-500 -mt-2">
        {isBundleMode
          ? 'Bundle cost is used to calculate the cost per yard for stock valuation.'
          : "Unit Cost feeds Profit & Loss margin calculations for this item's initial stock. Leave blank if you're only setting up the catalog with no stock yet."}
      </p>

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