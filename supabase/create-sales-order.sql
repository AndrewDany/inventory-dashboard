-- ============================================================
-- create_sales_order
--
-- Same atomicity fix as create_purchase_order: header + items
-- are inserted inside one plpgsql transaction, so a failed item
-- insert rolls back the header too instead of leaving an orphan
-- sales order with no lines.
-- ============================================================

create or replace function public.create_sales_order(
  p_so_number text,
  p_notes text default null,
  p_items jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_actor uuid := auth.uid();
  v_so record;
  v_item jsonb;
begin
  if v_actor is null then
    raise exception 'Not authenticated';
  end if;

  if p_so_number is null or length(trim(p_so_number)) = 0 then
    raise exception 'SO number is required';
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'At least one line item is required';
  end if;

  insert into public.sales_orders (so_number, notes, status, created_by)
  values (trim(p_so_number), p_notes, 'confirmed', v_actor)
  returning * into v_so;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    if v_item->>'sku' is null or length(trim(v_item->>'sku')) = 0 then
      raise exception 'Each line item requires a SKU';
    end if;

    if coalesce((v_item->>'quantity_ordered')::numeric, 0) <= 0 then
      raise exception 'Quantity ordered must be greater than zero for %', v_item->>'sku';
    end if;

    insert into public.sales_order_items (
      so_id, sku, inventory_item_id, quantity_ordered, unit_price, currency
    ) values (
      v_so.id,
      trim(v_item->>'sku'),
      nullif(v_item->>'inventory_item_id', '')::bigint,
      (v_item->>'quantity_ordered')::numeric,
      nullif(v_item->>'unit_price', '')::numeric,
      nullif(v_item->>'currency', '')
    );
  end loop;

  return jsonb_build_object('id', v_so.id, 'so_number', v_so.so_number);
end;
$$;

grant execute on function public.create_sales_order(text, text, jsonb) to authenticated;