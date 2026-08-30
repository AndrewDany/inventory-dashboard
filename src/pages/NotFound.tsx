import { Link } from 'react-router-dom'
import { Package } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-12 h-12 rounded-lg bg-indigo-600 flex items-center justify-center mx-auto mb-6">
          <Package size={22} className="text-white" />
        </div>
        <p className="text-sm font-semibold text-indigo-600 mb-2">404</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Page not found</h1>
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <Link
          to="/"
          className="inline-block bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}
