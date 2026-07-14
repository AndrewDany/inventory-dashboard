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
import { ScanLine } from 'lucide-react'
import BarcodeScanner from './BarcodeScanner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  const [showScanner, setShowScanner] = useState(false)

  const categories = useMemo(() => {
    const unique = new Set(items.map((i) => i.category).filter(Boolean))
    return Array.from(unique) as string[]
  }, [items])

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.sku.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = categoryFilter && categoryFilter !== 'all' ? item.category === categoryFilter : true
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
            <div className="space-x-2">
              <Button variant="ghost" size="sm" onClick={() => onEdit(info.row.original)}>
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700"
                onClick={() => onDelete(info.row.original)}
              >
                Delete
              </Button>
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
        <Input
          type="text"
          placeholder="Search by name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowScanner(true)}
          title="Scan barcode"
        >
          <ScanLine size={16} />
        </Button>
        <Select value={categoryFilter || 'all'} onValueChange={(v) => setCategoryFilter(v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showScanner && (
        <BarcodeScanner
          onClose={() => setShowScanner(false)}
          onScan={(code) => {
            setSearch(code)
            setShowScanner(false)
          }}
        />
      )}

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="cursor-pointer select-none"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {{ asc: ' ▲', desc: ' ▼' }[header.column.getIsSorted() as string] ?? ''}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {filteredItems.length === 0 && (
        <p className="text-gray-500 mt-4">No items match your search/filter.</p>
      )}
    </div>
  )
}