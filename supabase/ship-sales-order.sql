-- ============================================================
-- ship_sales_order — location-scoped fix
--
-- Problems in the previous version (see git history):
--   1. p_location_id was accepted but never used — availability
--      was checked against the single global inventory_items.quantity
--      pool, so an order could "ship" from a location that had zero
--      physical stock as long as some OTHER location had enough.
--   2. Because nothing was ever deducted from inventory_batch_stock,
--      the per-location batch ledger silently drifted out of sync
--      with reality after every shipment.
--
-- Fix, mirroring the pattern already used by process_return():
--   - For SKUs that have batch records at all (batch-tracked items),
--     availability and deduction are scoped to inventory_batch_stock
--     rows AT p_location_id specifically (FIFO by received_date).
--   - For SKUs with no batch records anywhere (legacy "simple" items,
--     added directly with a quantity + a single location_id), the
--     item's own inventory_items.location_id must match p_location_id
--     or it is treated as unavailable at this location.
--   - inventory_items.quantity is still maintained as the global
--     mirror total (used elsewhere in the app), decremented in
--     lock-step with whichever location-scoped deduction happens.
-- ============================================================

drop function if exists public.ship_sales_order(uuid, uuid, jsonb);

create or replace function public.ship_sales_order(
  p_so_id uuid,
  p_location_id uuid,
  p_items jsonb default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_actor uuid := auth.uid();
  v_actor_email text;
  v_so record;
  v_line record;
  v_batch_tracked boolean;
  v_available numeric;
  v_item_location uuid;
  v_shortfall numeric;
  v_complete boolean := true;
  v_lines jsonb := '[]'::jsonb;
  v_qty_to_remove numeric;
  v_take integer;
  v_batch record;
  v_prev_qty numeric;
  v_new_qty numeric;
begin
  if v_actor is null then
    raise exception 'Not authenticated';
  end if;

  if p_location_id is null then
    raise exception 'A ship-from location is required';
  end if;

  select email into v_actor_email from auth.users where id = v_actor;

  select * into v_so from public.sales_orders where id = p_so_id;
  if v_so is null then
    raise exception 'Sales order not found';
  end if;

  -- First pass: verify every line has enough stock AT THE SELECTED LOCATION
  -- before changing anything.
  for v_line in
    select
      soi.id,
      soi.sku,
      soi.inventory_item_id,
      soi.quantity_ordered,
      soi.quantity_shipped,
      (soi.quantity_ordered - soi.quantity_shipped) as remaining_qty
    from public.sales_order_items soi
    where soi.so_id = p_so_id
      and soi.quantity_ordered > soi.quantity_shipped
      and (
        p_items is null
        or exists (
          select 1
          from jsonb_array_elements(p_items) as x
          where x->>'item_id' = soi.inventory_item_id::text
        )
      )
  loop
    select exists (
      select 1 from public.inventory_batches b where b.sku = v_line.sku
    ) into v_batch_tracked;

    if v_batch_tracked then
      select coalesce(sum(bs.on_hand_quantity), 0) into v_available
      from public.inventory_batch_stock bs
      join public.inventory_batches b on b.id = bs.batch_id
      where b.sku = v_line.sku
        and bs.location_id = p_location_id;
    else
      v_available := 0;
      v_item_location := null;
      if v_line.inventory_item_id is not null then
        select quantity, location_id into v_available, v_item_location
        from public.inventory_items
        where id = v_line.inventory_item_id;

        if v_item_location is distinct from p_location_id then
          v_available := 0;
        end if;
      end if;
    end if;

    if v_line.remaining_qty > coalesce(v_available, 0) then
      v_complete := false;
      v_shortfall := v_line.remaining_qty - coalesce(v_available, 0);
      v_lines := v_lines || jsonb_build_object(
        'sku', v_line.sku,
        'shortfall', v_shortfall,
        'required', v_line.remaining_qty,
        'available', coalesce(v_available, 0)
      );
    end if;
  end loop;

  if not v_complete then
    return jsonb_build_object(
      'complete', false,
      'so_id', p_so_id,
      'location_id', p_location_id,
      'lines', v_lines
    );
  end if;

  -- Second pass: everything checked out at this location — deduct stock
  -- and log movements.
  for v_line in
    select
      soi.id,
      soi.sku,
      soi.inventory_item_id,
      (soi.quantity_ordered - soi.quantity_shipped) as remaining_qty
    from public.sales_order_items soi
    where soi.so_id = p_so_id
      and soi.quantity_ordered > soi.quantity_shipped
  loop
    v_prev_qty := 0;
    v_new_qty := 0;

    if v_line.inventory_item_id is not null then
      select quantity into v_prev_qty from public.inventory_items where id = v_line.inventory_item_id;
      v_prev_qty := coalesce(v_prev_qty, 0);
      v_new_qty := greatest(v_prev_qty - v_line.remaining_qty, 0);

      update public.inventory_items
      set quantity = v_new_qty,
          last_updated = now()
      where id = v_line.inventory_item_id;
    end if;

    insert into public.stock_movements (
      item_id,
      item_name,
      previous_quantity,
      new_quantity,
      change_amount,
      reason,
      user_id,
      user_email,
      batch_id,
      unit_cost
    )
    select
      v_line.inventory_item_id,
      v_line.sku,
      v_prev_qty,
      v_new_qty,
      -v_line.remaining_qty,
      'sales_shipment',
      v_actor,
      v_actor_email,
      latest_batch.id,
      coalesce(latest_batch.unit_cost, ii.unit_price, 0)
    from (select 1) dummy
    left join public.inventory_items ii on ii.id = v_line.inventory_item_id
    left join lateral (
      select b.id, b.unit_cost
      from public.inventory_batches b
      where b.sku = v_line.sku
      order by b.received_date desc, b.created_at desc
      limit 1
    ) latest_batch on true;

    -- FIFO-deduct from THIS location's batch ledger so it stays in sync
    -- with the shipment that just happened (mirrors process_return()).
    v_qty_to_remove := v_line.remaining_qty;
    for v_batch in
      select bs.id as stock_id, bs.batch_id, bs.on_hand_quantity
      from public.inventory_batch_stock bs
      join public.inventory_batches b on b.id = bs.batch_id
      where b.sku = v_line.sku
        and bs.location_id = p_location_id
        and bs.on_hand_quantity > 0
      order by b.received_date asc, b.created_at asc
    loop
      exit when v_qty_to_remove <= 0;
      v_take := least(v_qty_to_remove::integer, v_batch.on_hand_quantity);
      update public.inventory_batch_stock
      set on_hand_quantity = on_hand_quantity - v_take,
          updated_at = now()
      where id = v_batch.stock_id;
      v_qty_to_remove := v_qty_to_remove - v_take;
    end loop;

    update public.sales_order_items
    set quantity_shipped = quantity_ordered
    where id = v_line.id;
  end loop;

  update public.sales_orders
  set status = 'shipped',
      shipped_at = now()
  where id = p_so_id;

  return jsonb_build_object(
    'complete', true,
    'so_id', p_so_id,
    'location_id', p_location_id,
    'lines', jsonb '[]'
  );
end;
$$;

grant execute on function public.ship_sales_order(uuid, uuid, jsonb) to authenticated;