-- ============================================================
-- Returns & Replacements SQL
-- Run AFTER step1-inventory-upgrade-corrected.sql
-- Adds the returns table + process_return / cancel_return RPCs
--
-- Process flow:
--   pending  -> (process_return) -> completed
--   pending  -> (cancel_return)  -> cancelled
--
-- Stock effect per resolution:
--   restock          : returned qty is added back to sellable stock
--   replace          : returned qty is added back, THEN the same qty
--                      ships out as the replacement (net-zero stock)
--   write_off        : returned qty is removed from sellable stock
--   supplier_credit  : returned qty is removed from sellable stock
--   refund           : no stock change (customer keeps / item discarded)
-- ============================================================

-- ============================================================
-- 1) Enums (safe create)
-- ============================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'return_type') then
    create type public.return_type as enum ('customer_return','damaged_stock','supplier_return');
  end if;
  if not exists (select 1 from pg_type where typname = 'return_reason') then
    create type public.return_reason as enum ('damaged','defective','wrong_item','expired','other');
  end if;
  if not exists (select 1 from pg_type where typname = 'return_resolution') then
    create type public.return_resolution as enum ('replace','refund','restock','write_off','supplier_credit');
  end if;
  if not exists (select 1 from pg_type where typname = 'return_status') then
    create type public.return_status as enum ('pending','completed','cancelled');
  end if;
end $$;

-- ============================================================
-- 2) returns table
-- ============================================================
create table if not exists public.returns (
  id uuid primary key default gen_random_uuid(),
  return_number text not null unique,
  return_type public.return_type not null,
  inventory_item_id bigint null references public.inventory_items(id),
  sku text not null,
  location_id uuid null references public.locations(id) on delete set null,
  quantity numeric(14,4) not null check (quantity > 0),
  unit_cost numeric(14,4) null,
  reason public.return_reason not null,
  resolution public.return_resolution not null,
  status public.return_status not null default 'pending',
  reference_so_id uuid null,
  supplier_id uuid null references public.suppliers(id) on delete set null,
  customer_name text null,
  notes text null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  resolved_at timestamptz null
);

create index if not exists returns_created_at_idx on public.returns (created_at desc);
create index if not exists returns_sku_idx on public.returns (sku);
create index if not exists returns_status_idx on public.returns (status);

alter table public.returns enable row level security;

create policy if not exists "returns_select_admin_staff" on public.returns
for select using (public.is_admin_staff_or_demo());

create policy if not exists "returns_insert_admin" on public.returns
for insert with check (public.is_admin());

create policy if not exists "returns_update_admin" on public.returns
for update using (public.is_admin()) with check (public.is_admin());

create policy if not exists "returns_delete_admin" on public.returns
for delete using (public.is_admin());

-- ============================================================
-- 3) process_return
--    Applies stock changes based on resolution and marks the
--    return completed. Records stock_movements + audit_events.
-- ============================================================
create or replace function public.process_return(
  p_return_id uuid
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_actor uuid := auth.uid();
  v_actor_email text;
  v_return record;
  v_prev_qty numeric;
  v_new_qty numeric;
  v_qty_to_remove numeric;
  v_take integer;
  v_batch record;
  v_integral boolean;
begin
  if not public.is_admin() then
    raise exception 'Only admins can process returns';
  end if;

  select email into v_actor_email from auth.users where id = v_actor;

  select * into v_return from public.returns where id = p_return_id;
  if v_return is null then
    raise exception 'Return not found';
  end if;
  if v_return.status <> 'pending' then
    raise exception 'Only pending returns can be processed';
  end if;

  select quantity into v_prev_qty from public.inventory_items where id = v_return.inventory_item_id;
  v_prev_qty := coalesce(v_prev_qty, 0);
  v_new_qty := v_prev_qty;

  v_integral := (v_return.quantity = floor(v_return.quantity));

  if v_return.resolution in ('restock', 'replace') then
    -- Returned goods come back into sellable stock
    if v_return.inventory_item_id is not null then
      update public.inventory_items
      set quantity = quantity + v_return.quantity,
          last_updated = now()
      where id = v_return.inventory_item_id;
    end if;
    v_new_qty := v_prev_qty + v_return.quantity;

    insert into public.stock_movements (
      item_id, item_name, previous_quantity, new_quantity, change_amount,
      user_id, user_email, batch_id, unit_cost
    ) values (
      v_return.inventory_item_id, v_return.sku,
      v_prev_qty, v_new_qty, v_return.quantity,
      v_actor, v_actor_email, null, v_return.unit_cost
    );

    -- Add back to the most recent batch for this SKU at this location (best effort)
    if v_integral then
      select b.id as batch_id, bs.id as stock_id, bs.avg_unit_cost
      into v_batch
      from public.inventory_batches b
      left join public.inventory_batch_stock bs
        on bs.batch_id = b.id and bs.location_id = v_return.location_id
      where b.sku = v_return.sku
      order by b.received_date desc, b.created_at desc
      limit 1;

      if v_batch.batch_id is not null then
        insert into public.inventory_batch_stock (batch_id, location_id, on_hand_quantity, avg_unit_cost, updated_at)
        values (v_batch.batch_id, v_return.location_id, v_return.quantity::integer, coalesce(v_batch.avg_unit_cost, v_return.unit_cost), now())
        on conflict (batch_id, location_id)
        do update set
          on_hand_quantity = public.inventory_batch_stock.on_hand_quantity + excluded.on_hand_quantity,
          updated_at = now();
      end if;
    end if;

    if v_return.resolution = 'replace' then
      -- Replacement unit(s) ship out to the customer (net-zero stock)
      v_prev_qty := v_new_qty;
      v_new_qty := greatest(v_new_qty - v_return.quantity, 0);

      if v_return.inventory_item_id is not null then
        update public.inventory_items
        set quantity = greatest(quantity - v_return.quantity, 0),
            last_updated = now()
        where id = v_return.inventory_item_id;
      end if;

      insert into public.stock_movements (
        item_id, item_name, previous_quantity, new_quantity, change_amount,
        user_id, user_email, batch_id, unit_cost
      ) values (
        v_return.inventory_item_id, v_return.sku,
        v_prev_qty, v_new_qty, -v_return.quantity,
        v_actor, v_actor_email, null, v_return.unit_cost
      );

      -- Remove replacement units FIFO from batches (best effort)
      if v_integral then
        v_qty_to_remove := v_return.quantity;
        for v_batch in
          select bs.id as stock_id, bs.batch_id, bs.on_hand_quantity
          from public.inventory_batch_stock bs
          join public.inventory_batches b on b.id = bs.batch_id
          where b.sku = v_return.sku
            and bs.location_id = v_return.location_id
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
      end if;
    end if;

  elsif v_return.resolution in ('write_off', 'supplier_credit') then
    -- Goods removed from sellable stock (destroyed or sent back to supplier)
    if v_return.inventory_item_id is not null then
      update public.inventory_items
      set quantity = greatest(quantity - v_return.quantity, 0),
          last_updated = now()
      where id = v_return.inventory_item_id;
    end if;
    v_new_qty := greatest(v_prev_qty - v_return.quantity, 0);

    insert into public.stock_movements (
      item_id, item_name, previous_quantity, new_quantity, change_amount,
      user_id, user_email, batch_id, unit_cost
    ) values (
      v_return.inventory_item_id, v_return.sku,
      v_prev_qty, v_new_qty, -v_return.quantity,
      v_actor, v_actor_email, null, v_return.unit_cost
    );

    -- Remove FIFO from batches (best effort)
    if v_integral then
      v_qty_to_remove := v_return.quantity;
      for v_batch in
        select bs.id as stock_id, bs.batch_id, bs.on_hand_quantity
        from public.inventory_batch_stock bs
        join public.inventory_batches b on b.id = bs.batch_id
        where b.sku = v_return.sku
          and bs.location_id = v_return.location_id
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
    end if;

  else
    -- refund: no stock change (customer keeps the item)
    v_new_qty := v_prev_qty;
  end if;

  -- Audit trail (immutable)
  insert into public.audit_events (
    event_type, entity_type, entity_id, sku, location_id,
    quantity_delta, unit_cost, actor_user_id, actor_user_email, metadata
  ) values (
    'return_processed', 'return', v_return.id, v_return.sku, v_return.location_id,
    case when v_return.resolution in ('restock','replace') then v_return.quantity::integer else -v_return.quantity::integer end,
    v_return.unit_cost, v_actor, v_actor_email,
    jsonb_build_object(
      'return_number', v_return.return_number,
      'return_type', v_return.return_type,
      'reason', v_return.reason,
      'resolution', v_return.resolution
    )
  );

  update public.returns
  set status = 'completed',
      resolved_at = now()
  where id = p_return_id;

  return jsonb_build_object(
    'success', true,
    'return_id', v_return.id,
    'return_number', v_return.return_number,
    'resolution', v_return.resolution
  );
end;
$$;

-- ============================================================
-- 4) cancel_return
--    Marks a pending return as cancelled (no stock changes).
-- ============================================================
create or replace function public.cancel_return(
  p_return_id uuid
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_actor uuid := auth.uid();
  v_actor_email text;
  v_return record;
begin
  if not public.is_admin() then
    raise exception 'Only admins can cancel returns';
  end if;

  select email into v_actor_email from auth.users where id = v_actor;

  select * into v_return from public.returns where id = p_return_id;
  if v_return is null then
    raise exception 'Return not found';
  end if;
  if v_return.status <> 'pending' then
    raise exception 'Only pending returns can be cancelled';
  end if;

  update public.returns
  set status = 'cancelled',
      resolved_at = now()
  where id = p_return_id;

  insert into public.audit_events (
    event_type, entity_type, entity_id, sku, location_id,
    quantity_delta, actor_user_id, actor_user_email, metadata
  ) values (
    'return_cancelled', 'return', v_return.id, v_return.sku, v_return.location_id,
    0, v_actor, v_actor_email,
    jsonb_build_object('return_number', v_return.return_number)
  );

  return jsonb_build_object('success', true, 'return_id', v_return.id, 'status', 'cancelled');
end;
$$;

-- ============================================================
-- 5) Grants
-- ============================================================
grant execute on function public.process_return(uuid) to authenticated;
grant execute on function public.cancel_return(uuid) to authenticated;

-- ============================================================
-- End Returns & Replacements SQL
-- ============================================================

