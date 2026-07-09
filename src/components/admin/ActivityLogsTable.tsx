import { useActivityLogs } from '../../hooks/useActivityLogs'

const actionColors: Record<string, string> = {
  created: 'text-green-700 bg-green-50',
  updated: 'text-blue-700 bg-blue-50',
  deleted: 'text-red-700 bg-red-50',
}

export default function ActivityLogsTable() {
  const { data: logs, isLoading, error } = useActivityLogs()

  if (isLoading) return <p className="text-gray-500 text-sm">Loading activity...</p>
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>
  if (!logs || logs.length === 0) return <p className="text-gray-500 text-sm">No activity yet.</p>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="p-3">Action</th>
            <th className="p-3">Item</th>
            <th className="p-3">User</th>
            <th className="p-3">When</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-b">
              <td className="p-3">
                <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${actionColors[log.action]}`}>
                  {log.action}
                </span>
              </td>
              <td className="p-3">{log.item_name}</td>
              <td className="p-3 text-gray-600">{log.user_email}</td>
              <td className="p-3 text-gray-500">
                {new Date(log.created_at).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}