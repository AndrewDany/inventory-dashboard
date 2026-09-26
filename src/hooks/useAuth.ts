import { useState, useEffect } from 'react'
import { api, getAuthToken, setAuthSession, clearAuthSession, getStoredUser } from '../lib/apiClient'

export interface AuthUser {
  id: string
  email: string
  role: 'admin' | 'staff' | 'demo'
  full_name?: string | null
  avatar_url?: string | null
}

export interface AuthSession {
  user: AuthUser
}

export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(() => {
    const storedUser = getStoredUser<AuthUser>()
    const token = getAuthToken()
    return token && storedUser ? { user: storedUser } : null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getAuthToken()
    if (!token) {
      setSession(null)
      setLoading(false)
      return
    }

    api
      .get<AuthUser>('/auth/me')
      .then((user) => {
        setSession({ user })
        setAuthSession(token, user)
      })
      .catch(() => {
        clearAuthSession()
        setSession(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  async function signIn(email: string, password: string) {
    try {
      const res = await api.post<{ token: string; user: AuthUser }>('/auth/login', { email, password })
      if (res && res.token) {
        setAuthSession(res.token, res.user)
        setSession({ user: res.user })
        return { error: null }
      }
      return { error: { message: 'Invalid response from authentication server' } }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Login failed'
      return { error: { message: errorMsg } }
    }
  }

  async function signOut() {
    try {
      await api.post('/auth/logout')
    } catch {
      // Non-fatal if session token was already invalidated
    } finally {
      clearAuthSession()
      setSession(null)
      window.location.href = '/login'
    }
  }

  return { session, loading, signIn, signOut }
}