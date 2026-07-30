# Task: Unify "this month" revenue/COGS calculation

## Goal
Eliminate duplicate independent queries for "this month's" revenue and COGS.  
Derive these numbers from `useMonthlyFinancials`'s current-month row in `useProfitLoss.ts`.

## Steps
- [x] 1. Read and understand all relevant files
- [x] 2. Get plan approval
- [x] 3. Rewrite `src/hooks/useProfitLoss.ts` to derive revenue/COGS from `useMonthlyFinancials`
- [x] 4. Verify no consumer changes needed (AdminOverview, FinancialOverviewPanel, ProfitLossPanel)
- [x] 5. Test TypeScript compilation — ✅ no errors

---

# Task: Add "Add Expense" button back to ProfitLossPanel

## Goal
Restore the ability to add expenses directly from the Profit & Loss panel.

## Steps
- [x] 1. Read and understand all relevant files
- [x] 2. Get plan approval
- [x] 3. Added `useState` for modal toggle, "Add Expense" button with `Plus` icon in the header
- [x] 4. Added `Modal` with `ExpenseForm` at the bottom of the component
- [x] 5. Test TypeScript compilation

