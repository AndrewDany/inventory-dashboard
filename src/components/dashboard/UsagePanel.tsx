import { useUsage } from '../../hooks/useUsage'

export default function UsagePanel() {
  const { data: usage, isLoading } = useUsage()

  if (isLoading) return null
  if (!usage) return null

  const maxUsage = Math.max(usage.itemCount, usage.userCount, usage.locationCount, 1)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Inventory Items</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">{usage.itemCount}</p>
        <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all"
            style={{ width: `${(usage.itemCount / maxUsage) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Active Users</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">{usage.userCount}</p>
        <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${(usage.userCount / maxUsage) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Locations</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">{usage.locationCount}</p>
        <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 rounded-full transition-all"
            style={{ width: `${(usage.locationCount / maxUsage) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Storage Used</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">{usage.storageUsed}</p>
        <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-500 rounded-full transition-all"
            style={{ width: `${Math.min((usage.itemCount / 1000) * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
