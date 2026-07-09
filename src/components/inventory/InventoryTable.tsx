import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table'
import type { InventoryItem } from '../../types/inventory'

const columnHelper = createColumnHelper<InventoryItem>()

export default function InventoryTable({
  items,
  onEdit,
  onDelete,
  isAdmin,
}: {
  items: InventoryItem[]
  onEdit: (item: InventoryItem) => void
  onDelete: (item: InventoryItem) => void
  isAdmin: boolean
}) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const categories = useMemo(() => {
    const unique = new Set(items.map((i) => i.category).filter(Boolean))
    return Array.from(unique) as string[]
  }, [items])

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.sku.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = categoryFilter ? item.category === categoryFilter : true
      return matchesSearch && matchesCategory
    })
  }, [items, search, categoryFilter])

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', { header: 'Name' }),
      columnHelper.accessor('sku', { header: 'SKU' }),
      columnHelper.accessor('category', { header: 'Category' }),
      columnHelper.accessor('quantity', { header: 'Quantity' }),
      columnHelper.accessor('reorder_level', { header: 'Reorder Level' }),
      columnHelper.accessor('unit_price', { header: 'Unit Price' }),
      columnHelper.accessor('supplier', { header: 'Supplier' }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: (info) =>
          isAdmin ? (
            <div className="space-x-3">
              <button
                onClick={() => onEdit(info.row.original)}
                className="text-blue-600 hover:underline text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(info.row.original)}
                className="text-red-600 hover:underline text-sm"
              >
                Delete
              </button>
            </div>
          ) : (
            <span className="text-gray-400 text-sm">—</span>
          ),
      }),
    ],
    [onEdit, onDelete, isAdmin]
  )

  const table = useReactTable({
    data: filteredItems,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm flex-1"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white shadow rounded">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b text-left text-sm text-gray-500">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="p-3 cursor-pointer select-none"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {{ asc: ' ▲', desc: ' ▼' }[header.column.getIsSorted() as string] ?? ''}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b text-sm">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredItems.length === 0 && (
        <p className="text-gray-500 mt-4">No items match your search/filter.</p>
      )}
    </div>
  )
}