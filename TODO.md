# Task Progress

## ✅ Invoice Preview, Customer Bill, Payment Status & Print
(Previous completed work)

## ✅ Monthly Gross Sales & Acquisition Costs

### New File Created:
1. **`src/hooks/useMonthlyFinancials.ts`** ✅
   - New `MonthlyFinancial` interface (month, grossSales, acquisitionCost)
   - `useMonthlyFinancials()` hook queries `sales_orders` (with `sales_order_items`) and `purchase_orders` (with `purchase_order_items`) for the last 12 months
   - Computes monthly aggregates: gross sales revenue (quantity × unit_price) and acquisition costs (quantity × unit_cost)
   - Returns sorted array by month (YYYY-MM)

### Files Modified:
2. **`src/pages/AdminPanel.tsx`** ✅
   - Imported `useMonthlyFinancials` hook
   - Added "Monthly financials" section in the Overview tab showing:
     - **Monthly Gross Sales** card (current month's sales revenue)
     - **Monthly Acquisition Costs** card (current month's stock purchase costs)
     - **Last 12 months trend table** with month-by-month breakdown
