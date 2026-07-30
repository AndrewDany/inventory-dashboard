import ActivityLogsTable from '../../components/admin/ActivityLogsTable'

export default function AdminActivity() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Activity Log</h3>
        <p className="mt-1 text-sm text-slate-500">Review the latest events for better oversight.</p>
      </div>
      <ActivityLogsTable />
    </div>
  )
}

