import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/layout/ProtectedRoute'
import AdminRoute from './components/layout/AdminRoute'
import ScrollToTop from './components/layout/ScrollToTop'

const Landing       = lazy(() => import('./pages/Landing'))
const Login         = lazy(() => import('./pages/Login'))
const Dashboard     = lazy(() => import('./pages/Dashboard'))
const AdminPanel    = lazy(() => import('./pages/AdminPanel'))
const PointOfSale   = lazy(() => import('./pages/PointOfSale'))
const NotFound      = lazy(() => import('./pages/NotFound'))

const AdminOverview     = lazy(() => import('./pages/admin/AdminOverview'))
const AdminLocations    = lazy(() => import('./pages/admin/AdminLocations'))
const AdminUsers        = lazy(() => import('./pages/admin/AdminUsers'))
const AdminOrders       = lazy(() => import('./pages/admin/AdminOrders'))
const AdminSalesOrders  = lazy(() => import('./pages/admin/AdminSalesOrders'))
const AdminPreOrders    = lazy(() => import('./pages/admin/AdminPreOrders'))
const AdminLowStock     = lazy(() => import('./pages/admin/AdminLowStock'))
const AdminSuppliers    = lazy(() => import('./pages/admin/AdminSuppliers'))
const AdminMovements    = lazy(() => import('./pages/admin/AdminMovements'))
const AdminBatches      = lazy(() => import('./pages/admin/AdminBatches'))
const AdminAdjustments  = lazy(() => import('./pages/admin/AdminAdjustments'))
const AdminValuation    = lazy(() => import('./pages/admin/AdminValuation'))
const AdminActivity     = lazy(() => import('./pages/admin/AdminActivity'))
const AdminAuditEvents  = lazy(() => import('./pages/admin/AdminAuditEvents'))
const AdminReturns      = lazy(() => import('./pages/admin/AdminReturns'))
const AdminReports      = lazy(() => import('./pages/admin/AdminReports'))
const AdminFinancials   = lazy(() => import('./pages/admin/AdminFinancials'))
const AdminSettings     = lazy(() => import('./pages/admin/AdminSettings'))

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          </div>
        }
      >
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<AdminOverview />} />
          <Route path="locations" element={<AdminLocations />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="sales-orders" element={<AdminSalesOrders />} />
          <Route path="pre-orders" element={<AdminPreOrders />} />
          <Route path="low-stock" element={<AdminLowStock />} />
          <Route path="suppliers" element={<AdminSuppliers />} />
          <Route path="movements" element={<AdminMovements />} />
          <Route path="batches" element={<AdminBatches />} />
          <Route path="returns" element={<AdminReturns />} />
          <Route path="adjustments" element={<AdminAdjustments />} />
          <Route path="valuation" element={<AdminValuation />} />
          <Route path="activity" element={<AdminActivity />} />
          <Route path="audit-events" element={<AdminAuditEvents />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="financials" element={<AdminFinancials />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
        <Route
          path="/pos"
          element={
            <ProtectedRoute>
              <PointOfSale />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
