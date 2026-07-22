import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AdminPanel from './pages/AdminPanel'
import PointOfSale from './pages/PointOfSale'
import ProtectedRoute from './components/layout/ProtectedRoute'
import AdminRoute from './components/layout/AdminRoute'
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
        />
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