import type { InventoryItem } from '../../types/inventory'

export default function StatsCards({ items }: { items: InventoryItem[] }) {
  const totalItems = items.length

  const totalValue = items.reduce((sum, item) => {
    const price = item.unit_price ?? 0
    return sum + item.quantity * price
  }, 0)

  const lowStockCount = items.filter((item) => item.quantity <= item.reorder_level).length

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-5">
        <p className="text-sm text-gray-500">Total Items</p>
        <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
      </div>

      <div className="bg-white rounded-lg shadow p-5">
        <p className="text-sm text-gray-500">Total Inventory Value</p>
        <p className="text-2xl font-bold text-gray-900">
          GHS {totalValue.toFixed(2)}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-5">
        <p className="text-sm text-gray-500">Low Stock Items</p>
        <p className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
          {lowStockCount}
        </p>
      </div>
    </div>
  )
}