-- ============================================================
-- create_purchase_order
--
-- Fixes: the client previously did two separate insert() calls
-- (header, then items). If the items insert failed for any reason
-- (bad SKU, RLS, network blip), the PO header had already been
-- committed, leaving an orphaned PO with zero line items and no
-- way to clean it up from the UI.
--
-- A plpgsql function body is one implicit transaction: if the
-- items insert raises, the header insert is rolled back too.
-- ============================================================

create or replace function public.create_purchase_order(
  p_po_number text,
  p_supplier_id uuid default null,
  p_notes text default null,
  p_items jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_actor uuid := auth.uid();
  v_po record;
  v_item jsonb;
begin
  if v_actor is null then
    raise exception 'Not authenticated';
  end if;

  if p_po_number is null or length(trim(p_po_number)) = 0 then
    raise exception 'PO number is required';
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'At least one line item is required';
  end if;

  insert into public.purchase_orders (po_number, supplier_id, notes, status, created_by)
  values (trim(p_po_number), p_supplier_id, p_notes, 'ordered', v_actor)
  returning * into v_po;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    if v_item->>'sku' is null or length(trim(v_item->>'sku')) = 0 then
      raise exception 'Each line item requires a SKU';
    end if;

    if coalesce((v_item->>'quantity_ordered')::numeric, 0) <= 0 then
      raise exception 'Quantity ordered must be greater than zero for %', v_item->>'sku';
    end if;

    insert into public.purchase_order_items (
      po_id, sku, inventory_item_id, quantity_ordered, unit_cost, currency
    ) values (
      v_po.id,
      trim(v_item->>'sku'),
      nullif(v_item->>'inventory_item_id', '')::bigint,
      (v_item->>'quantity_ordered')::numeric,
      nullif(v_item->>'unit_cost', '')::numeric,
      nullif(v_item->>'currency', '')
    );
  end loop;

  return jsonb_build_object('id', v_po.id, 'po_number', v_po.po_number);
end;
$$;

grant execute on function public.create_purchase_order(text, uuid, text, jsonb) to authenticated;