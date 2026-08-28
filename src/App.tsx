import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AdminPanel from './pages/AdminPanel'
import AdminOverview from './pages/admin/AdminOverview'
import AdminLocations from './pages/admin/AdminLocations'
import AdminUsers from './pages/admin/AdminUsers'
import AdminOrders from './pages/admin/AdminOrders'
import AdminSalesOrders from './pages/admin/AdminSalesOrders'
import AdminLowStock from './pages/admin/AdminLowStock'
import AdminSuppliers from './pages/admin/AdminSuppliers'
import AdminMovements from './pages/admin/AdminMovements'
import AdminBatches from './pages/admin/AdminBatches'
import AdminAdjustments from './pages/admin/AdminAdjustments'
import AdminValuation from './pages/admin/AdminValuation'
import AdminActivity from './pages/admin/AdminActivity'
import AdminAuditEvents from './pages/admin/AdminAuditEvents'
import AdminReturns from './pages/admin/AdminReturns'
import AdminReports from './pages/admin/AdminReports'
import AdminFinancials from './pages/admin/AdminFinancials'
import PointOfSale from './pages/PointOfSale'
import ProtectedRoute from './components/layout/ProtectedRoute'
import AdminRoute from './components/layout/AdminRoute'
import ScrollToTop from './components/layout/ScrollToTop'
import { isSupabaseConfigured } from './lib/supabaseClient'

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
    </BrowserRouter>
  )
}

export default App