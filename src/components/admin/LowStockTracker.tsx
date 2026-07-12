import { useInventory } from '../../hooks/useInventory'

export default function LowStockTracker() {
  const { data: items, isLoading, error } = useInventory()

  if (isLoading) return <p className="text-gray-500 text-sm">Loading...</p>
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>

  const lowStockItems = (items ?? [])
    .filter((item) => item.quantity <= item.reorder_level)
    .sort((a, b) => a.quantity - b.quantity)

  if (lowStockItems.length === 0)
    return <p className="text-gray-500 text-sm">All items are above their reorder level.</p>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="p-3">Item</th>
            <th className="p-3">SKU</th>
            <th className="p-3">Current Qty</th>
            <th className="p-3">Reorder Level</th>
            <th className="p-3">Supplier</th>
          </tr>
        </thead>
        <tbody>
          {lowStockItems.map((item) => (
            <tr key={item.id} className="border-b">
              <td className="p-3">{item.name}</td>
              <td className="p-3 text-gray-500">{item.sku}</td>
              <td className="p-3">
                <span className="text-red-600 font-medium">{item.quantity}</span>
              </td>
              <td className="p-3 text-gray-600">{item.reorder_level}</td>
              <td className="p-3 text-gray-600">{item.supplier || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}