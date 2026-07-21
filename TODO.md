# TODO - Professional Inventory Management System Upgrade

## Step 1 — Data model & types
- [ ] Add new Supabase tables for: 
  - [ ] inventory_batches (lot/batch, expiry, received date)
  - [ ] inventory_batch_stock (on-hand qty per batch)
  - [ ] purchase_orders, purchase_order_items
  - [ ] sales_orders, sales_order_items
  - [ ] inventory_adjustments (manual +/-)
  - [ ] valuation_runs (FIFO/Avg costing recompute history)
  - [ ] audit_events (generic stock-impact/audit trail)
- [ ] Update existing tables (references):
  - [ ] inventory_items -> default location/supplier + link to valuation/batch behavior
  - [ ] stock_movements -> optionally reference batch_id
  - [x] Fix FK type mismatch: existing `inventory_items.id` is bigint, while new order tables use uuid in this schema (we will remove/adjust FK constraints to match types).

- [ ] Create TS types for all new entities.

## Step 2 — Edge Functions
- [ ] receive-purchase-order
  - Creates purchase receipt + updates batch stock + inserts stock movements + audit_events
  - Supports creating batches if missing
- [ ] ship-sales-order
  - Allocates from batches (FIFO or Avg)
  - Deducts batch stock + inserts stock movements + audit_events
- [ ] apply-inventory-adjustment
  - Manual add/remove by quantity (and batch allocation where required)
  - Inserts adjustment + stock movements + audit_events
- [ ] recompute-valuation
  - Backfill/periodic recompute + valuation_runs
- [ ] (Optional) reconcile-stock
  - Compare expected vs physical counts; produce adjustment draft

## Step 3 — React hooks + API layer
- [ ] Add hooks:
  - [ ] usePurchaseOrders
  - [ ] useSalesOrders
  - [ ] useInventoryBatches
  - [ ] useInventoryAdjustments
- [ ] Add mutations that call the edge functions.
- [ ] Ensure query invalidation for inventory, batches, movements, audit.

## Step 4 — UI: purchase orders & receiving
- [ ] PurchaseOrdersTable (admin)
- [ ] PurchaseOrderForm
- [ ] ReceivePOModal (calls receive-purchase-order)

## Step 5 — UI: sales orders & shipping
- [ ] SalesOrdersTable (admin)
- [ ] SalesOrderForm
- [ ] ShipSOModal (calls ship-sales-order)

## Step 6 — UI: inventory adjustments
- [ ] InventoryAdjustmentForm (admin)
- [ ] Modal with reason, quantity, batch/lot selection
- [ ] Integrate existing BarcodeScanner for SKU lookup + optional batch scan

## Step 7 — UI: audit & advanced reporting
- [ ] AuditEventsTable (admin)
- [ ] Valuation report (inventory value by batch/lot + costing method)
- [ ] Stock on-hand & low-stock by batch

## Step 8 — Quality
- [ ] Lint/build/typecheck
- [ ] Basic RBAC review (admin/staff/demo)
- [ ] Manual QA checklist for all stock-affecting actions


