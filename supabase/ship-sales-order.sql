-- ============================================================
-- Corrected ship_sales_order
-- Fixes:
--   1. Removed reference to sales_order_items.shipped_at (that
--      column does not exist in this schema — only
--      sales_orders.shipped_at does).
--   2. Confirmed no reference to a stock_movements.location_id
--      column (it does not exist on stock_movements — only
--      item_id, item_name, previous_quantity, new_quantity,
--      change_amount, user_id, user_email, batch_id, unit_cost).
--   3. Kept your simplified "canonical inventory_items.quantity
--      is the source of truth" approach (no per-location batch
--      deduction) — note this means quantity is NOT currently
--      location-scoped for shipping purposes; all locations draw
--      from the same inventory_items.quantity pool.
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
  v_total_available numeric;
  v_shortfall numeric;
  v_complete boolean := true;
  v_lines jsonb := '[]'::jsonb;
begin
  if v_actor is null then
    raise exception 'Not authenticated';
  end if;

  select email into v_actor_email from auth.users where id = v_actor;

  select * into v_so from public.sales_orders where id = p_so_id;
  if v_so is null then
    raise exception 'Sales order not found';
  end if;

  -- First pass: verify every line has enough stock before changing anything
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
    if v_line.inventory_item_id is null then
      select coalesce(sum(on_hand_quantity), 0) into v_total_available
      from public.inventory_batch_stock bs
      join public.inventory_batches b on b.id = bs.batch_id
      where b.sku = v_line.sku;
    else
      select coalesce(quantity, 0) into v_total_available
      from public.inventory_items
      where id = v_line.inventory_item_id
      limit 1;
    end if;

    if v_line.remaining_qty > v_total_available then
      v_complete := false;
      v_shortfall := v_line.remaining_qty - v_total_available;
      v_lines := v_lines || jsonb_build_object(
        'sku', v_line.sku,
        'shortfall', v_shortfall,
        'required', v_line.remaining_qty,
        'available', v_total_available
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

  -- Second pass: everything checked out — actually deduct stock and log movements
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
    if v_line.inventory_item_id is not null then
      update public.inventory_items
      set quantity = greatest(quantity - v_line.remaining_qty, 0),
          last_updated = now()
      where id = v_line.inventory_item_id;
    end if;

    insert into public.stock_movements (
      item_id,
      item_name,
      previous_quantity,
      new_quantity,
      change_amount,
      user_id,
      user_email,
      unit_cost
    )
    select
      v_line.inventory_item_id,
      v_line.sku,
      ii.quantity + v_line.remaining_qty,
      ii.quantity,
      -v_line.remaining_qty,
      v_actor,
      v_actor_email,
      coalesce(ii.unit_price, 0)
    from public.inventory_items ii
    where ii.id = v_line.inventory_item_id;

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