import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { locationSchema, type LocationFormValues } from '../../lib/locationSchema'
import { useAddLocation, useUpdateLocation } from '../../hooks/useLocations'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { Location } from '../../types/location'

export default function LocationForm({
  onClose,
  location,
}: {
  onClose: () => void
  location?: Location
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(locationSchema),
    defaultValues: location
      ? { name: location.name, address: location.address ?? '' }
      : undefined,
  })

  const addLocation = useAddLocation()
  const updateLocation = useUpdateLocation()
  const isEditMode = Boolean(location)

  async function onSubmit(values: LocationFormValues) {
    if (isEditMode && location) {
      await updateLocation.mutateAsync({ id: location.id, values })
    } else {
      await addLocation.mutateAsync(values)
    }
    onClose()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="loc-name" className="mb-1 block">Location Name</Label>
        <Input id="loc-name" {...register('name')} placeholder="e.g. Kumasi Branch" />
        {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="loc-address" className="mb-1 block">Address</Label>
        <Input id="loc-address" {...register('address')} />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Add Location'}
        </Button>
      </div>
    </form>
  )
}