import { useState, useRef, useEffect } from 'react'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { exportToCSV, exportToPDF } from '../../lib/exportInventory'
import type { InventoryItem } from '../../types/inventory'

export default function ExportMenu({ items }: { items: InventoryItem[] }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 text-sm"
      >
        <Download size={16} />
        Export
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
          <button
            onClick={() => {
              exportToCSV(items)
              setOpen(false)
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 text-left"
          >
            <FileSpreadsheet size={16} className="text-green-600" />
            Export as CSV
          </button>
          <button
            onClick={() => {
              exportToPDF(items)
              setOpen(false)
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 text-left"
          >
            <FileText size={16} className="text-red-600" />
            Export as PDF
          </button>
        </div>
      )}
    </div>
  )
}