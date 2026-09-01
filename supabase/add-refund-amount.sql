-- ============================================================
-- Add refund_amount to returns
-- Run AFTER returns-and-replacements.sql
--
-- Why: process_return() correctly leaves stock untouched for a
-- 'refund' resolution, but nothing anywhere records how much money
-- was actually refunded to the customer. That meant the P&L
-- (useProfitLoss / useMonthlyFinancials) kept counting the original
-- sale as revenue in full even after it was refunded, overstating
-- gross profit and net profit for any month with refunds.
--
-- This column lets the app capture the refunded amount when the
-- return is logged, so it can be subtracted from revenue for the
-- month the refund was completed.
-- ============================================================

alter table public.returns
  add column if not exists refund_amount numeric(14,4) null;

comment on column public.returns.refund_amount is
  'Amount refunded to the customer. Only meaningful when resolution = refund. Subtracted from monthly revenue in the P&L.';