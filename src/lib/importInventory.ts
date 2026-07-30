import { z } from 'zod'

export const csvRowSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  category: z.string().optional().default(''),
  quantity: z.coerce.number().int().min(0, 'Quantity cannot be negative').default(0),
  reorder_level: z.coerce.number().int().min(0, 'Reorder level cannot be negative').default(0),
  unit_price: z.coerce.number().min(0, 'Price cannot be negative').optional(),
  supplier: z.string().optional().default(''),
  location_id: z.string().optional().default(''),
})

export type CSVImportRow = z.infer<typeof csvRowSchema>

export interface ParsedCSVResult {
  rows: CSVImportRow[]
  errors: { row: number; message: string }[]
}

export function parseCSVText(csvText: string): ParsedCSVResult {
  const lines = csvText.split('\n').map((l) => l.trim()).filter(Boolean)
  if (lines.length < 2) return { rows: [], errors: [{ row: 0, message: 'CSV must have a header row and at least one data row' }] }

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''))
  const rows: CSVImportRow[] = []
  const errors: { row: number; message: string }[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim().replace(/['"]/g, ''))
    const rowData: Record<string, string> = {}

    headers.forEach((header, idx) => {
      rowData[header] = values[idx] ?? ''
    })

    const result = csvRowSchema.safeParse(rowData)
    if (result.success) {
      rows.push(result.data)
    } else {
      errors.push({
        row: i + 1,
        message: result.error.issues.map((iss) => `${iss.path.join('.')}: ${iss.message}`).join('; '),
      })
    }
  }

  return { rows, errors }
}

