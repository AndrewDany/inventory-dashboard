import LocationsTable from '../../components/admin/LocationsTable'

export default function AdminLocations() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Locations</h3>
          <p className="mt-1 text-sm text-slate-500">Manage branches and distribute access with clarity.</p>
        </div>
      </div>
      <LocationsTable />
    </div>
  )
}

