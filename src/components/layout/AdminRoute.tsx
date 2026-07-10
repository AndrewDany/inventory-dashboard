import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useProfile } from '../../hooks/useProfile'

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const { data: profile, isLoading, isFetched } = useProfile()

  // Wait until we have a session AND the profile query has actually completed
  if (!session || isLoading || !isFetched) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (profile?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}