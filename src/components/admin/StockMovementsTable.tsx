import { useStockMovements } from '../../hooks/useStockMovements'

export default function StockMovementsTable() {
  const { data: movements, isLoading, error } = useStockMovements()

  if (isLoading) return <p className="text-gray-500 text-sm">Loading stock movements...</p>
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>
  if (!movements || movements.length === 0)
    return <p className="text-gray-500 text-sm">No stock changes recorded yet.</p>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="p-3">Item</th>
            <th className="p-3">Change</th>
            <th className="p-3">Before → After</th>
            <th className="p-3">User</th>
            <th className="p-3">When</th>
          </tr>
        </thead>
        <tbody>
          {movements.map((m) => (
            <tr key={m.id} className="border-b">
              <td className="p-3">{m.item_name}</td>
              <td className="p-3">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    m.change_amount > 0
                      ? 'text-green-700 bg-green-50'
                      : 'text-red-700 bg-red-50'
                  }`}
                >
                  {m.change_amount > 0 ? `+${m.change_amount}` : m.change_amount}
                </span>
              </td>
              <td className="p-3 text-gray-600">
                {m.previous_quantity} → {m.new_quantity}
              </td>
              <td className="p-3 text-gray-600">{m.user_email}</td>
              <td className="p-3 text-gray-500">{new Date(m.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}