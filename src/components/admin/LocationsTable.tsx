import { useState } from 'react'
import { useLocations, useDeleteLocation } from '../../hooks/useLocations'
import Modal from '../ui/Modal'
import LocationForm from './LocationForm'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Location } from '../../types/location'

export default function LocationsTable() {
  const { data: locations, isLoading, error } = useLocations()
  const deleteLocation = useDeleteLocation()
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)

  if (isLoading) return <p className="text-gray-500 text-sm">Loading locations...</p>
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>

  return (
    <div>
      {(!locations || locations.length === 0) && (
        <p className="text-gray-500 text-sm">No locations yet — add your first one from the sidebar.</p>
      )}

      {locations && locations.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations.map((loc) => (
              <TableRow key={loc.id}>
                <TableCell>{loc.name}</TableCell>
                <TableCell className="text-gray-600">{loc.address || '—'}</TableCell>
                <TableCell className="space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => setEditingLocation(loc)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => deleteLocation.mutate(loc.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {editingLocation && (
        <Modal title="Edit Location" onClose={() => setEditingLocation(null)}>
          <LocationForm location={editingLocation} onClose={() => setEditingLocation(null)} />
        </Modal>
      )}
    </div>
  )
}