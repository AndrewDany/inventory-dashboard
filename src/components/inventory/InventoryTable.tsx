import { Fragment, useState, useMemo, lazy, Suspense } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table'
import { Image as ImageIcon, ScanLine } from 'lucide-react'
const BarcodeScanner = lazy(() => import('./BarcodeScanner'))
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

function canonicalCategory(category: string | null): string | null {
  return category?.toUpperCase().replace(/[^A-Z0-9]/g, '') === 'SANDPAPER' ? 'SANDPAPER' : category
}

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
    const unique = new Set(items.map((i) => canonicalCategory(i.category)).filter(Boolean))
    return Array.from(unique) as string[]
  }, [items])

  const filteredItems = useMemo(() => {
    const q = search.toLowerCase()
    return items.filter((item) => {
      const matchesSearch = [item.name, item.sku, item.category, item.type, item.brand, item.color, item.size].some(
        (value) => String(value ?? '').toLowerCase().includes(q)
      )
      const matchesCategory =
        categoryFilter && categoryFilter !== 'all'
          ? canonicalCategory(item.category) === categoryFilter
          : true
      return matchesSearch && matchesCategory
    })
  }, [items, search, categoryFilter])

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'image',
        header: 'Image',
        cell: (info) => {
          const item = info.row.original
          return item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              loading="lazy"
              className="h-10 w-10 rounded border border-slate-200 object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded border border-dashed border-slate-300 bg-slate-50 text-slate-400">
              <ImageIcon size={16} aria-label="No product image" />
            </div>
          )
        },
      }),
      columnHelper.accessor('name', {
        header: 'Name',
        cell: (info) => {
          const item = info.row.original
          return (
            <div>
              <div>{info.getValue()}</div>
              {item.unit_of_measure === 'yard' && item.bundle_yards != null && (
                <div className="text-[10px] text-slate-500">1 yard</div>
              )}
            </div>
          )
        },
      }),
      columnHelper.accessor('sku', { header: 'SKU' }),
      columnHelper.accessor('category', {
        header: 'Category',
        cell: (info) => info.getValue() || '—',
      }),
      columnHelper.accessor('type', {
        header: 'Type',
        cell: (info) => info.getValue() || '—',
      }),
      columnHelper.accessor('brand', {
        header: 'Brand',
        cell: (info) => info.getValue() || '—',
      }),
      columnHelper.accessor('color', {
        header: 'Color',
        cell: (info) => info.getValue() || '—',
      }),
      columnHelper.accessor('size', {
        header: 'Size',
        cell: (info) => info.getValue() || '—',
      }),
      columnHelper.accessor('quantity', { header: 'Quantity' }),
      columnHelper.accessor('reorder_level', { header: 'Reorder Level' }),
      columnHelper.accessor('unit_cost', {
        header: 'Cost Price',
        cell: (info) => {
          const cost = info.getValue()
          return cost != null ? `GHC ${Number(cost).toFixed(2)}` : '—'
        },
      }),
      columnHelper.accessor('unit_price', {
        header: 'Selling Price',
        cell: (info) => {
          const price = info.getValue()
          return price != null ? `GHC ${Number(price).toFixed(2)}` : '—'
        },
      }),
      columnHelper.accessor('supplier', {
        header: 'Supplier',
        cell: (info) => info.getValue() || '—',
      }),
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
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Inventory Catalog</h3>
          <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
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
        <Suspense fallback={null}>
          <BarcodeScanner
            onClose={() => setShowScanner(false)}
            onScan={(code) => {
              setSearch(code)
              setShowScanner(false)
            }}
          />
        </Suspense>
      )}

      <div className="overflow-x-auto overflow-y-auto max-h-[480px] rounded-xl border border-slate-100/90">
        <Table className="relative w-full">
          <TableHeader className="sticky top-0 bg-slate-50/95 backdrop-blur-xs z-10 border-b border-slate-200 shadow-2xs">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="cursor-pointer select-none text-xs font-semibold text-slate-700 bg-slate-50 py-3 whitespace-nowrap"
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
            {table.getRowModel().rows.map((row) => {
              const item = row.original
              const hasBundlePricing = item.unit_of_measure === 'yard'
                && item.bundle_yards != null
                && (item.bundle_price != null || item.bundle_cost != null)
              const bundleCost = item.bundle_cost != null
                ? Number(item.bundle_cost)
                : item.unit_cost != null && item.bundle_yards != null
                  ? Number(item.unit_cost) * Number(item.bundle_yards)
                  : null

              return (
                <Fragment key={row.id}>
                  <TableRow className="hover:bg-slate-50/80 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-2.5 text-xs whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                  {hasBundlePricing && (
                    <TableRow className="bg-slate-50/70 hover:bg-slate-50">
                      {row.getVisibleCells().map((cell) => {
                        if (cell.column.id === 'name') {
                          return (
                            <TableCell key={cell.id} className="py-2 text-xs font-medium text-slate-600 whitespace-nowrap">
                              {item.name} Bundle
                            </TableCell>
                          )
                        }
                        if (cell.column.id === 'unit_cost') {
                          return (
                            <TableCell key={cell.id} className="py-2 text-xs whitespace-nowrap">
                              {bundleCost == null ? '—' : `GHC ${bundleCost.toFixed(2)}`}
                            </TableCell>
                          )
                        }
                        if (cell.column.id === 'unit_price') {
                          return (
                            <TableCell key={cell.id} className="py-2 text-xs whitespace-nowrap">
                              {item.bundle_price == null ? '—' : `GHC ${Number(item.bundle_price).toFixed(2)}`}
                            </TableCell>
                          )
                        }
                        return <TableCell key={cell.id} className="py-2 text-xs" />
                      })}
                    </TableRow>
                  )}
                </Fragment>
              )
            })}
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