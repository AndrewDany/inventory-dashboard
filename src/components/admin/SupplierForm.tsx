import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { supplierSchema, type SupplierFormValues } from '../../lib/supplierSchema'
import { useAddSupplier, useUpdateSupplier } from '../../hooks/useSuppliers'
import { Button } from '@/components/ui/button'
import type { Supplier } from '../../types/supplier'

export default function SupplierForm({
  onClose,
  supplier,
}: {
  onClose: () => void
  supplier?: Supplier
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(supplierSchema),
    defaultValues: supplier
      ? {
          name: supplier.name,
          contact_person: supplier.contact_person ?? '',
          phone: supplier.phone ?? '',
          email: supplier.email ?? '',
          address: supplier.address ?? '',
          notes: supplier.notes ?? '',
        }
      : undefined,
  })

  const addSupplier = useAddSupplier()
  const updateSupplier = useUpdateSupplier()
  const isEditMode = Boolean(supplier)

  async function onSubmit(values: SupplierFormValues) {
    if (isEditMode && supplier) {
      await updateSupplier.mutateAsync({ id: supplier.id, values })
    } else {
      await addSupplier.mutateAsync(values)
    }
    onClose()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>
        <input {...register('name')} className="w-full border border-gray-300 rounded px-3 py-2" />
        {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
        <input {...register('contact_person')} className="w-full border border-gray-300 rounded px-3 py-2" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input {...register('phone')} className="w-full border border-gray-300 rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input {...register('email')} className="w-full border border-gray-300 rounded px-3 py-2" />
          {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <input {...register('address')} className="w-full border border-gray-300 rounded px-3 py-2" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea {...register('notes')} rows={2} className="w-full border border-gray-300 rounded px-3 py-2" />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Add Supplier'}
        </Button>
      </div>
    </form>
  )
}