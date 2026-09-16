<?php
// ============================================================
// Expenses & Financial Controls Routes
// ============================================================

declare(strict_types=1);

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../middleware/auth.php';

function handleExpenseRoutes(PDO $pdo, string $method, array $uriParts): void
{
    $auth = requireAuth();
    $id = $uriParts[1] ?? null;

    if ($id && $method === 'DELETE') {
        if ($auth['role'] === 'demo') jsonError('Demo account cannot delete expenses', 403);
        $stmt = $pdo->prepare('DELETE FROM expenses WHERE id = ?');
        $stmt->execute([$id]);
        jsonSuccess(null, 200, 'Expense deleted');
    }

    if ($method === 'GET') {
        $stmt = $pdo->query('SELECT * FROM expenses ORDER BY date DESC, created_at DESC');
        jsonSuccess($stmt->fetchAll());
    }

    if ($method === 'POST') {
        if ($auth['role'] === 'demo') jsonError('Demo account cannot add expenses', 403);
        $input = getJsonInput();
        $date = $input['date'] ?? date('Y-m-d');
        $category = trim($input['category'] ?? 'Operations');
        $description = trim($input['description'] ?? '');
        $amount = (float)($input['amount'] ?? 0.00);
        $paymentMethod = $input['payment_method'] ?? 'bank_transfer';
        $vendor = $input['vendor'] ?? null;
        $receiptUrl = $input['receipt_url'] ?? null;

        if (empty($description) || $amount <= 0) {
            jsonError('Description and positive amount are required', 400);
        }

        $id = generateUuid();
        $stmt = $pdo->prepare('
            INSERT INTO expenses (id, date, category, description, amount, payment_method, vendor, receipt_url, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([$id, $date, $category, $description, $amount, $paymentMethod, $vendor, $receiptUrl, $auth['email'] ?? 'system']);

        $fetch = $pdo->prepare('SELECT * FROM expenses WHERE id = ?');
        $fetch->execute([$id]);
        jsonSuccess($fetch->fetch(), 201, 'Expense recorded');
    }

    jsonError('Method not allowed', 405);
}

// Real COGS per shipped sales_order_item: quantity_shipped × that SKU's most
// recent inventory_batches.unit_cost as of the order's ship/creation date.
// Falls back to 0 (rather than a guessed markup) when a SKU has no batch
// records at all — a missing real cost should not be silently invented.
// unit_price * 0.6 (the previous logic) was never anchored to what was
// actually paid for the stock and made every margin/profit number fictional.
const COGS_SUBQUERY = 'COALESCE((SELECT ib.unit_cost FROM inventory_batches ib WHERE ib.sku = soi.sku AND ib.received_date <= so.created_at ORDER BY ib.received_date DESC LIMIT 1), 0)';

function handleFinancialRoutes(PDO $pdo, string $method, array $uriParts): void
{
    $auth = requireAuth();
    $subAction = $uriParts[1] ?? '';

    switch ($subAction) {
        // GET /api/financials/profit-loss
        case 'profit-loss':
            if ($method !== 'GET') jsonError('Method not allowed', 405);

            // 1. Gross Sales (from shipped sales orders)
            $salesStmt = $pdo->query('
                SELECT COALESCE(SUM(soi.quantity_shipped * soi.unit_price), 0) as total_sales
                FROM sales_order_items soi
                JOIN sales_orders so ON so.id = soi.so_id
                WHERE so.status = "shipped"
            ');
            $grossSales = (float)$salesStmt->fetchColumn();

            // 2. Total Refunds (money actually paid back to a customer).
            // supplier_credit is excluded: that's money owed back to the
            // business BY a supplier for defective stock returned to them —
            // it is not a customer refund and does not reduce customer revenue.
            $refundStmt = $pdo->query('
                SELECT COALESCE(SUM(refund_amount), 0) as total_refunds
                FROM returns
                WHERE status = "completed" AND resolution = "refund"
            ');
            $totalRefunds = (float)$refundStmt->fetchColumn();
            $netSales = $grossSales - $totalRefunds;

            // 3. COGS — real cost from inventory_batches, not a guessed markup.
            $cogsStmt = $pdo->query('
                SELECT COALESCE(SUM(soi.quantity_shipped * (' . COGS_SUBQUERY . ')), 0) as real_cogs
                FROM sales_order_items soi
                JOIN sales_orders so ON so.id = soi.so_id
                WHERE so.status = "shipped"
            ');
            $cogs = (float)$cogsStmt->fetchColumn();
            $grossProfit = $netSales - $cogs;
            $grossMargin = $netSales > 0 ? round(($grossProfit / $netSales) * 100, 2) : 0;

            // 4. Operating Expenses by Category
            $expCatStmt = $pdo->query('
                SELECT category, SUM(amount) as total
                FROM expenses
                GROUP BY category
                ORDER BY total DESC
            ');
            $expensesByCategory = $expCatStmt->fetchAll();
            $totalExpenses = array_sum(array_column($expensesByCategory, 'total'));

            $netProfit = $grossProfit - $totalExpenses;
            $netMargin = $netSales > 0 ? round(($netProfit / $netSales) * 100, 2) : 0;

            jsonSuccess([
                'grossSales' => $grossSales,
                'totalRefunds' => $totalRefunds,
                'netSales' => $netSales,
                'cogs' => $cogs,
                'grossProfit' => $grossProfit,
                'grossMargin' => $grossMargin,
                'totalExpenses' => $totalExpenses,
                'netProfit' => $netProfit,
                'netMargin' => $netMargin,
                'expensesByCategory' => $expensesByCategory
            ]);
            break;

        // GET /api/financials/monthly
        case 'monthly':
            if ($method !== 'GET') jsonError('Method not allowed', 405);

            $monthly = [];
            for ($i = 11; $i >= 0; $i--) {
                $monthDate = date('Y-m', strtotime("-$i months"));

                // Sales in month
                $sStmt = $pdo->prepare('
                    SELECT COALESCE(SUM(soi.quantity_shipped * soi.unit_price), 0)
                    FROM sales_order_items soi
                    JOIN sales_orders so ON so.id = soi.so_id
                    WHERE so.status = "shipped" AND DATE_FORMAT(so.created_at, "%Y-%m") = ?
                ');
                $sStmt->execute([$monthDate]);
                $sales = (float)$sStmt->fetchColumn();

                // Refunds in month (customer refunds only — see note in profit-loss)
                $rStmt = $pdo->prepare('
                    SELECT COALESCE(SUM(refund_amount), 0)
                    FROM returns
                    WHERE status = "completed" AND resolution = "refund"
                      AND DATE_FORMAT(COALESCE(resolved_at, created_at), "%Y-%m") = ?
                ');
                $rStmt->execute([$monthDate]);
                $refunds = (float)$rStmt->fetchColumn();

                // COGS in month — real batch cost, not a guessed markup
                $cStmt = $pdo->prepare('
                    SELECT COALESCE(SUM(soi.quantity_shipped * (' . COGS_SUBQUERY . ')), 0)
                    FROM sales_order_items soi
                    JOIN sales_orders so ON so.id = soi.so_id
                    WHERE so.status = "shipped" AND DATE_FORMAT(so.created_at, "%Y-%m") = ?
                ');
                $cStmt->execute([$monthDate]);
                $cogs = (float)$cStmt->fetchColumn();

                // Expenses in month
                $eStmt = $pdo->prepare('
                    SELECT COALESCE(SUM(amount), 0)
                    FROM expenses
                    WHERE DATE_FORMAT(date, "%Y-%m") = ?
                ');
                $eStmt->execute([$monthDate]);
                $expenses = (float)$eStmt->fetchColumn();

                $netSales = $sales - $refunds;
                $grossProfit = $netSales - $cogs;
                $netProfit = $grossProfit - $expenses;

                $monthly[] = [
                    'month' => $monthDate,
                    'grossSales' => $sales,
                    'refunds' => $refunds,
                    'cogs' => $cogs,
                    'grossProfit' => $grossProfit,
                    'expenses' => $expenses,
                    'netProfit' => $netProfit
                ];
            }

            jsonSuccess($monthly);
            break;

        // GET /api/financials/budget & PUT /api/financials/budget
        case 'budget':
            if ($method === 'GET') {
                $bStmt = $pdo->query('SELECT monthly_budget FROM budget_settings LIMIT 1');
                $monthlyBudget = (float)($bStmt->fetchColumn() ?: 50000.00);

                $curMonth = date('Y-m');
                $spentPo = $pdo->prepare('
                    SELECT COALESCE(SUM(poi.quantity_ordered * poi.unit_cost), 0)
                    FROM purchase_order_items poi
                    JOIN purchase_orders po ON po.id = poi.po_id
                    WHERE DATE_FORMAT(po.created_at, "%Y-%m") = ?
                ');
                $spentPo->execute([$curMonth]);
                $poSpent = (float)$spentPo->fetchColumn();

                $spentExp = $pdo->prepare('SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE DATE_FORMAT(date, "%Y-%m") = ?');
                $spentExp->execute([$curMonth]);
                $expSpent = (float)$spentExp->fetchColumn();

                $totalSpent = $poSpent + $expSpent;

                jsonSuccess([
                    'monthlyBudget' => $monthlyBudget,
                    'spentThisMonth' => $totalSpent,
                    'remaining' => max(0, $monthlyBudget - $totalSpent)
                ]);
            }

            if ($method === 'PUT' || $method === 'POST') {
                if ($auth['role'] !== 'admin') jsonError('Only admin can set budget', 403);
                $input = getJsonInput();
                $newBudget = (float)($input['monthly_budget'] ?? 50000.00);

                $stmt = $pdo->prepare('
                    INSERT INTO budget_settings (id, monthly_budget) VALUES (1, ?)
                    ON DUPLICATE KEY UPDATE monthly_budget = VALUES(monthly_budget)
                ');
                $stmt->execute([$newBudget]);
                jsonSuccess(['monthly_budget' => $newBudget], 200, 'Budget updated');
            }
            break;

        // GET /api/financials/valuation
        case 'valuation':
            if ($method !== 'GET') jsonError('Method not allowed', 405);

            // Real cost valuation: batch-tracked SKUs are valued at their
            // actual on-hand batch cost (sum of on_hand_quantity * unit_cost
            // across all batches for that SKU), not a guessed 0.7 markdown.
            // Items with no batch records fall back to unit_price * 0.7 as
            // a last-resort estimate, same as before, since no real cost
            // exists for them.
            $stmt = $pdo->query('
                SELECT
                    i.id,
                    i.quantity,
                    i.unit_price,
                    (SELECT COALESCE(SUM(ib.on_hand_quantity), 0) FROM inventory_batches ib WHERE ib.sku = i.sku) as batch_units,
                    (SELECT COALESCE(SUM(ib.on_hand_quantity * ib.unit_cost), 0) FROM inventory_batches ib WHERE ib.sku = i.sku) as batch_cost_total
                FROM inventory_items i
            ');
            $items = $stmt->fetchAll();

            $totalSkus = count($items);
            $totalUnits = 0;
            $retailValuation = 0.0;
            $costValuation = 0.0;

            foreach ($items as $item) {
                $qty = (int)$item['quantity'];
                $unitPrice = (float)$item['unit_price'];
                $totalUnits += $qty;
                $retailValuation += $qty * $unitPrice;

                if ((int)$item['batch_units'] > 0) {
                    // Weighted average cost across this SKU's batches, applied
                    // to the item's current mirror quantity.
                    $avgCost = (float)$item['batch_cost_total'] / (int)$item['batch_units'];
                    $costValuation += $qty * $avgCost;
                } else {
                    $costValuation += $qty * $unitPrice * 0.7;
                }
            }

            jsonSuccess([
                'total_skus' => $totalSkus,
                'total_units' => $totalUnits,
                'retail_valuation' => $retailValuation,
                'cost_valuation' => $costValuation,
                'calculated_at' => date('Y-m-d H:i:s')
            ]);
            break;

        default:
            jsonError('Financial endpoint not found', 404);
    }
}