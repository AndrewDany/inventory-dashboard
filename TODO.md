# TODO: Returns & Replacements Feature

## Goal
Add replacement of items / return of items to the codebase, develop the UI, and render it in the admin panel.

## Steps
- [ ] Step 1: Create `supabase/returns-and-replacements.sql` (returns table, process_return RPC, cancel_return RPC, RLS policies, grants)
- [ ] Step 2: Enhance `src/types/returns.ts` (resolution/status labels + badge variant maps)
- [ ] Step 3: Enhance `src/lib/returnSchema.ts` (conditional required customer/supplier)
- [ ] Step 4: Enhance `src/hooks/useReturns.ts` (add useCancelReturn, broaden cache invalidation)
- [ ] Step 5: Enhance `src/components/admin/ReturnsTable.tsx` (location names, resolution/customer/supplier/date columns, cancel action, status filter)
- [ ] Step 6: Enhance `src/components/admin/ReturnForm.tsx` (required customer/supplier per type, resolution helper text)
- [ ] Step 7: Create `src/pages/admin/AdminReturns.tsx` (page wrapper)
- [ ] Step 8: Wire route in `src/App.tsx` (`/admin/returns`)
- [ ] Step 9: Add sidebar link in `src/components/layout/Sidebar.tsx` (Returns with RotateCcw icon)
- [ ] Step 10: Verify — run `npm run build` (tsc) and fix any type errors

