-- ============================================================
-- Backfill refund_amount for historical returns
-- Run AFTER add-refund-amount.sql
--
-- Context: `reference_so_id` on `returns` is never actually populated
-- by the app (the return form doesn't collect it), so there's no
-- reliable link from an old completed 'refund' return back to the
-- exact sales_order_item it refunds. This script ESTIMATES the
-- refunded amount as quantity * the closest-in-time unit_price sold
-- for that SKU, and marks every backfilled row so it can be reviewed.
--
-- This does NOT touch any row that already has a refund_amount
-- (e.g. refunds logged after the fix went live).
-- ============================================================

-- 1) Flag column so estimated rows are distinguishable from
--    amounts a staff member actually entered.
alter table public.returns
  add column if not exists refund_amount_estimated boolean not null default false;

comment on column public.returns.refund_amount_estimated is
  'True if refund_amount was backfilled by estimating from sale history rather than entered by staff. Review these.';

-- 2) Backfill, picking for each refund return the sales_order_items
--    row for the same SKU whose sales_order.created_at is closest
--    in time to the return's created_at (before or after — whichever
--    is nearer). Falls back to the SKU's average sale price if no
--    exact-SKU sale exists at all.
with candidate_prices as (
  select
    soi.unit_price,
    so.created_at as sale_date,
    soi.sku
  from public.sales_order_items soi
  join public.sales_orders so on so.id = soi.so_id
  where soi.quantity_shipped > 0
),
ranked as (
  select
    r.id as return_id,
    r.quantity,
    cp.unit_price,
    row_number() over (
      partition by r.id
      order by abs(extract(epoch from (cp.sale_date - r.created_at)))
    ) as rn
  from public.returns r
  join candidate_prices cp on cp.sku = r.sku
  where r.resolution = 'refund'
    and r.status = 'completed'
    and r.refund_amount is null
),
nearest_price as (
  select return_id, quantity, unit_price
  from ranked
  where rn = 1
),
sku_avg_price as (
  select sku, avg(unit_price) as avg_unit_price
  from candidate_prices
  group by sku
)
update public.returns r
set
  refund_amount = coalesce(
    (select np.quantity * np.unit_price from nearest_price np where np.return_id = r.id),
    (select r.quantity * sap.avg_unit_price from sku_avg_price sap where sap.sku = r.sku)
  ),
  refund_amount_estimated = true
where r.resolution = 'refund'
  and r.status = 'completed'
  and r.refund_amount is null
  and exists (
    select 1 from candidate_prices cp where cp.sku = r.sku
  );

-- 3) Anything left with refund_amount still null has no sale history
--    at all for that SKU (e.g. a discontinued item) — these need a
--    manual number from whoever processed the original refund.
select
  id,
  return_number,
  sku,
  quantity,
  created_at,
  resolved_at
from public.returns
where resolution = 'refund'
  and status = 'completed'
  and refund_amount is null
order by created_at desc;

-- ============================================================
-- Review query: see everything that was estimated, to sanity-check
-- or correct amounts before trusting historical monthly P&L trends.
-- ============================================================
-- select return_number, sku, quantity, refund_amount, created_at, resolved_at
-- from public.returns
-- where refund_amount_estimated = true
-- order by created_at desc;