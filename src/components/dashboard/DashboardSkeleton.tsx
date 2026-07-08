export default function DashboardSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-5">
            <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
            <div className="h-7 bg-gray-200 rounded w-16"></div>
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="bg-white rounded-lg shadow p-5 mb-6">
        <div className="h-4 bg-gray-200 rounded w-40 mb-4"></div>
        <div className="h-[250px] bg-gray-100 rounded"></div>
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-lg shadow p-5">
        <div className="h-8 bg-gray-200 rounded mb-4 w-full max-w-md"></div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 bg-gray-100 rounded mb-2"></div>
        ))}
      </div>
    </div>
  )
}