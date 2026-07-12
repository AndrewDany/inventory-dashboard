import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { inventoryItemSchema, type InventoryFormValues } from '../../lib/schemas'
import { useAddInventoryItem, useUpdateInventoryItem } from '../../hooks/useInventory'
import type { InventoryItem } from '../../types/inventory'

export default function InventoryForm({
  onClose,
  item,
}: {
  onClose: () => void
  item?: InventoryItem
}) {
  const {
    register,
    handleSubmit,
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
        }
      : undefined,
  })

  const addItem = useAddInventoryItem()
  const updateItem = useUpdateInventoryItem()
  const isEditMode = Boolean(item)

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
        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input {...register('name')} className="w-full border border-gray-300 rounded px-3 py-2" />
        {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
        <input {...register('sku')} className="w-full border border-gray-300 rounded px-3 py-2" />
        {errors.sku && <p className="text-red-600 text-sm mt-1">{errors.sku.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <input {...register('category')} className="w-full border border-gray-300 rounded px-3 py-2" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
          <input type="number" {...register('quantity')} className="w-full border border-gray-300 rounded px-3 py-2" />
          {errors.quantity && <p className="text-red-600 text-sm mt-1">{errors.quantity.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
          <input type="number" {...register('reorder_level')} className="w-full border border-gray-300 rounded px-3 py-2" />
          {errors.reorder_level && <p className="text-red-600 text-sm mt-1">{errors.reorder_level.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
        <input type="number" step="0.01" {...register('unit_price')} className="w-full border border-gray-300 rounded px-3 py-2" />
        {errors.unit_price && <p className="text-red-600 text-sm mt-1">{errors.unit_price.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
        <input {...register('supplier')} className="w-full border border-gray-300 rounded px-3 py-2" />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Add Item'}
        </button>
      </div>
    </form>
  )
}