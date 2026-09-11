-- ============================================================
-- Backfill: restock completed returns that were processed before
-- inventory_item_id was resolved reliably.
--
-- Symptom: a return shows status = 'completed' and resolution in
-- ('restock','replace','refund'), a stock_movements row with
-- reason = 'return' exists for it, but inventory_items.quantity was
-- never actually incremented — because the return's
-- inventory_item_id was null at the time process_return() ran, so
-- the UPDATE on inventory_items was silently skipped.
--
-- Run the SELECT first and review the rows before running the
-- UPDATE. This only targets returns where inventory_item_id is
-- CURRENTLY null (i.e. was never resolved) — once you run this,
-- also re-run returns-and-replacements.sql to install the patched
-- process_return() so this can't recur.
-- ============================================================

-- 1) Inspect affected returns (safe, read-only)
select
  r.id,
  r.return_number,
  r.sku,
  r.quantity,
  r.resolution,
  r.status,
  r.resolved_at,
  i.id as matching_inventory_item_id,
  i.quantity as current_item_quantity
from public.returns r
left join public.inventory_items i on i.sku = r.sku
where r.status = 'completed'
  and r.resolution in ('restock', 'replace', 'refund')
  and r.inventory_item_id is null
order by r.resolved_at desc;

-- 2) Repair: link the return to its item AND apply the missed stock
--    increase, in one transaction per row. Run only after reviewing
--    step 1 — this assumes each sku maps to exactly one inventory item.
do $$
declare
  v_row record;
  v_prev_qty numeric;
  v_new_qty numeric;
begin
  for v_row in
    select r.id as return_id, r.sku, r.quantity, r.unit_cost, r.resolution
    from public.returns r
    where r.status = 'completed'
      and r.resolution in ('restock', 'replace', 'refund')
      and r.inventory_item_id is null
  loop
    -- Link the return to its item now, so it doesn't show up again
    update public.returns
    set inventory_item_id = (select id from public.inventory_items where sku = v_row.sku limit 1)
    where id = v_row.return_id;

    select quantity into v_prev_qty
    from public.inventory_items
    where sku = v_row.sku;

    if v_prev_qty is null then
      raise notice 'Skipping return % — no inventory item found for sku %', v_row.return_id, v_row.sku;
      continue;
    end if;

    v_new_qty := v_prev_qty + v_row.quantity;

    update public.inventory_items
    set quantity = v_new_qty,
        last_updated = now()
    where sku = v_row.sku;

    insert into public.stock_movements (
      item_id, item_name, previous_quantity, new_quantity, change_amount,
      reason, user_id, user_email, batch_id, unit_cost
    )
    select
      i.id, i.sku, v_prev_qty, v_new_qty, v_row.quantity,
      'return', auth.uid(),
      (select email from auth.users where id = auth.uid()),
      null, v_row.unit_cost
    from public.inventory_items i
    where i.sku = v_row.sku;

    raise notice 'Restocked return % — sku % + % (now %)', v_row.return_id, v_row.sku, v_row.quantity, v_new_qty;
  end loop;
end $$;
