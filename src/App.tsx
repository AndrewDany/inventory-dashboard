import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/layout/ProtectedRoute'
import AdminRoute from './components/layout/AdminRoute'
import ScrollToTop from './components/layout/ScrollToTop'
import { isSupabaseConfigured } from './lib/supabaseClient'

const Landing       = lazy(() => import('./pages/Landing'))
const Login         = lazy(() => import('./pages/Login'))
const Dashboard     = lazy(() => import('./pages/Dashboard'))
const AdminPanel    = lazy(() => import('./pages/AdminPanel'))
const PointOfSale   = lazy(() => import('./pages/PointOfSale'))

const AdminOverview     = lazy(() => import('./pages/admin/AdminOverview'))
const AdminLocations    = lazy(() => import('./pages/admin/AdminLocations'))
const AdminUsers        = lazy(() => import('./pages/admin/AdminUsers'))
const AdminOrders       = lazy(() => import('./pages/admin/AdminOrders'))
const AdminSalesOrders  = lazy(() => import('./pages/admin/AdminSalesOrders'))
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
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-xl w-full bg-white rounded-3xl border border-gray-200 shadow-lg p-10 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Deployment not configured</h1>
          <p className="text-gray-600 mb-6">
            The application requires Supabase environment variables to run.
            Please add <code className="bg-gray-100 px-2 py-1 rounded">VITE_SUPABASE_URL</code> and{' '}
            <code className="bg-gray-100 px-2 py-1 rounded">VITE_SUPABASE_ANON_KEY</code> in Vercel.
          </p>
          <p className="text-sm text-gray-500">
            This prevents a blank page when the app starts without configuration.
          </p>
        </div>
      </div>
    )
  }
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
      </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
