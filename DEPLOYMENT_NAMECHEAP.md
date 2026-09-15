# Namecheap cPanel Deployment Guide

This guide walks you through deploying the **Inventory Suite** with its **PHP 8 + MySQL Backend** and **React SPA Frontend** to Namecheap cPanel shared hosting (`public_html/`).

---

## 1. Prerequisites on Namecheap
1. Log into your **cPanel**.
2. Under **Software** -> **Select PHP Version**, ensure PHP **8.1, 8.2, or 8.3** is selected.
   - Verify that `pdo_mysql`, `json`, `mbstring`, and `openssl` extensions are enabled (enabled by default).
3. Under **Databases** -> **MySQL Databases**:
   - Create a new MySQL database (e.g. `yourcpanel_inventory`).
   - Create a new MySQL user with a strong password (e.g. `yourcpanel_dbuser`).
   - Add the user to the database with **ALL PRIVILEGES**.

---

## 2. Import Database Schema & Seed Data
1. Open **phpMyAdmin** from cPanel.
2. Select your newly created database in the left sidebar.
3. Click the **Import** tab:
   - First choose [`db/schema.sql`](file:///c:/Users/Andrews/inventory-dashboard/db/schema.sql) and click **Go** (creates all tables, indexes, foreign keys).
   - Next choose [`db/seed.sql`](file:///c:/Users/Andrews/inventory-dashboard/db/seed.sql) and click **Go** (seeds initial administrator, locations, suppliers, budget).

---

## 3. Configure Database Credentials (`api/config/db_config.php`)
1. In the `api/config/` folder, create a file named `db_config.php` (or copy [`api/config/db_config.php.example`](file:///c:/Users/Andrews/inventory-dashboard/api/config/db_config.php.example)):
```php
<?php
return [
    'host'     => 'localhost',
    'database' => 'yourcpanel_inventory',
    'username' => 'yourcpanel_dbuser',
    'password' => 'YourSecretDbPasswordHere',
];
```
*(Optionally set a custom `JWT_SECRET` in `api/config/config.php` for production security).*

---

## 4. Build Frontend & Prepare Upload Files
Run the build script locally:
```bash
npm run build
```
This produces all production frontend static assets in `dist/`.

---

## 5. Upload to `public_html` via cPanel File Manager or FTP
Place files into your `public_html/` root (or subfolder/subdomain directory) as follows:

```
public_html/
│
├── .htaccess             <-- Root SPA rewrite rules (copied from dist/.htaccess or public/.htaccess)
├── index.html            <-- React SPA root (from dist/)
├── favicon.ico
├── assets/               <-- Built CSS/JS bundles and images (from dist/assets/)
│   ├── index-*.js
│   ├── index-*.css
│   └── ...
│
└── api/                  <-- Upload the entire api/ folder here
    ├── .htaccess         <-- API rewrite & Authorization header rules
    ├── index.php         <-- API router entrypoint
    ├── config/
    │   ├── config.php
    │   ├── db.php
    │   └── db_config.php <-- Your server DB credentials from Step 3
    ├── helpers/
    │   ├── jwt.php
    │   └── response.php
    ├── middleware/
    │   └── auth.php
    └── routes/
        ├── auth.php
        ├── inventory.php
        ├── locations.php
        ├── suppliers.php
        ├── adjustments.php
        ├── purchase_orders.php
        ├── sales_orders.php
        ├── returns.php
        ├── expenses.php
        ├── financials.php
        ├── users.php
        ├── audit.php
        ├── notifications.php
        └── reports.php
```

---

## 6. Verification Checklist
- [ ] Visit `https://yourdomain.com/` — The Landing page loads smoothly.
- [ ] Visit `https://yourdomain.com/api/health` — Returns `{"success": true, "status": "online", "service": "Inventory Suite REST API"}`.
- [ ] Log in with the default seeded Admin:
  - **Email**: `admin@inventory.local`
  - **Password**: `admin123`
- [ ] Navigate to `/admin/overview`, `/admin/locations`, `/pos`, etc. — Subroutes route seamlessly through `index.html`.
- [ ] Create or update items, perform sales or adjustments, check live profit & loss calculations.

