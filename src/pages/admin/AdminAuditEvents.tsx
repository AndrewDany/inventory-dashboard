import AuditEventsTable from '../../components/admin/AuditEventsTable'

export default function AdminAuditEvents() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Audit Events</h3>
        <p className="mt-1 text-sm text-slate-500">Detailed view of all inventory events with filtering.</p>
      </div>
      <AuditEventsTable />
    </div>
  )
}

