import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useProfile } from '../../hooks/useProfile'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading, signOut } = useAuth()
  const { data: profile, isLoading: profileLoading, isFetched } = useProfile()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (profileLoading || !isFetched) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (profile?.status === 'suspended') {
    signOut()
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Account Suspended</h1>
          <p className="text-gray-600 text-sm">
            Your account has been suspended. Contact your administrator for assistance.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}