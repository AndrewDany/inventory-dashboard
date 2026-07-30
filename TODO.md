# TODO: Fix Location ID Display Issue

## Problem
Location UUIDs are displayed instead of location names in order forms and sales orders.

## Steps
- [x] Step 1: Analyze codebase to find all locations where location IDs are displayed as raw UUIDs
- [x] Step 2: **InventoryBatchesTable.tsx** - Replace raw `location_id` display with location name using `useLocations()` hook
- [x] Step 3: **InventoryTable.tsx** - Add a "Location" column that resolves `location_id` to location name
- [x] Step 4: **BulkProductModal.tsx** - Update "Location ID" label to "Location"

