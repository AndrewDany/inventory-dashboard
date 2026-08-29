# TODO: Returns & Replacements Feature ✅ COMPLETE

## Goal
Add replacement of items / return of items to the codebase, develop the UI, and render it in the admin panel.

## Steps
- [x] Step 1: Create `supabase/returns-and-replacements.sql` (returns table, process_return RPC, cancel_return RPC, RLS policies, grants)
- [x] Step 2: Enhance `src/types/returns.ts` (resolution/status labels + badge variant maps)
- [x] Step 3: Enhance `src/lib/returnSchema.ts` (conditional required customer/supplier)
- [x] Step 4: Enhance `src/hooks/useReturns.ts` (add useCancelReturn, broaden cache invalidation)
- [x] Step 5: Enhance `src/components/admin/ReturnsTable.tsx` (location names, resolution/customer/supplier/date columns, cancel action, status filter)
- [x] Step 6: Enhance `src/components/admin/ReturnForm.tsx` (required customer/supplier per type, resolution helper text)
- [x] Step 7: Create `src/pages/admin/AdminReturns.tsx` (page wrapper)
- [x] Step 8: Wire route in `src/App.tsx` (`/admin/returns`)
- [x] Step 9: Add sidebar link in `src/components/layout/Sidebar.tsx` (Returns with RotateCcw icon)
- [x] Step 10: Verify — `npm run build` passed clean (tsc + vite, exit 0, no type errors)

