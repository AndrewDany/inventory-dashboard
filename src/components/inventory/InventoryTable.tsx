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
import { useLocations } from '../../hooks/useLocations'
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
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [showScanner, setShowScanner] = useState(false)
  const { data: locations } = useLocations()

  const locationsMap = useMemo(() => {
    if (!locations) return {}
    return Object.fromEntries(locations.map((loc) => [loc.id, loc.name]))
  }, [locations])

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
        id: 'location',
        header: 'Location',
        cell: (info) => {
          const locationId = info.row.original.location_id
          return locationId ? (locationsMap[locationId] ?? '—') : '—'
        },
      }),
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
    [onEdit, onDelete, isAdmin, locationsMap]
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
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <h3 className="text-base font-semibold text-slate-900">Inventory Catalog</h3>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
            {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        <div className="flex items-center gap-2.5 flex-1 sm:max-w-md justify-end">
          <Input
            type="text"
            placeholder="Search SKU or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 text-xs flex-1"
          />
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => setShowScanner(true)}
            title="Scan barcode"
          >
            <ScanLine size={16} />
          </Button>
          <Select value={categoryFilter ?? 'all'} onValueChange={(v) => setCategoryFilter(v === 'all' ? null : v)}>
            <SelectTrigger className="h-9 w-36 text-xs shrink-0">
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

      <div className="overflow-x-auto overflow-y-auto max-h-[480px] rounded-xl border border-slate-100/90">
        <Table className="relative w-full">
          <TableHeader className="sticky top-0 bg-slate-50/95 backdrop-blur-xs z-10 border-b border-slate-200 shadow-2xs">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="cursor-pointer select-none text-xs font-semibold text-slate-700 bg-slate-50 py-3"
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
              <TableRow key={row.id} className="hover:bg-slate-50/80 transition-colors">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="py-2.5 text-xs">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>Showing {filteredItems.length} of {items.length} items</span>
        <span className="text-slate-400">Scroll to browse full catalog</span>
      </div>

      {filteredItems.length === 0 && (
        <div className="py-8 text-center text-xs text-slate-500">
          No items match your search or category filter.
        </div>
      )}
    </div>
  )
}