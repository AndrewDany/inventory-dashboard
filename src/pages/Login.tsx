import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Package } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import loginPhoto from '../assets/landing/tablet-check.jpg'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await signIn(email, password)

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:grid lg:grid-cols-2 bg-gray-50">
      {/* Photo panel: compact card on mobile, full-bleed split on desktop */}
      <div className="relative w-full max-w-md mx-auto mt-6 px-6 lg:px-0 lg:mt-0 lg:max-w-none lg:mx-0">
        <div className="relative h-48 sm:h-64 lg:h-full rounded-2xl lg:rounded-none overflow-hidden shadow-md lg:shadow-none">
          <img
            src={loginPhoto}
            alt="Warehouse worker checking stock on a tablet"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/85 via-indigo-900/50 to-indigo-900/20" />

          <div className="relative h-full flex flex-col justify-between p-4 lg:p-10 text-white">
            <Link to="/" className="flex items-center gap-2 w-fit">
              <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center">
                <Package size={16} className="text-white" />
              </div>
              <span className="font-bold">Inventory Dashboard</span>
            </Link>

            <div className="max-w-sm">
              <h2 className="text-2xl font-bold mb-3 leading-snug">
                Know exactly what's on your shelves, every day.
              </h2>
              <p className="text-indigo-100 text-sm hidden lg:block">
                Sign in to track stock, manage orders, and keep your team aligned,
                all from one dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right: form panel */}
      <div className="flex items-center justify-center flex-1 bg-gray-50 px-6 py-10 lg:py-16">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h1>
          <p className="text-sm text-gray-500 mb-8">Sign in to your account to continue.</p>

          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
            {error && (
              <p className="text-red-600 text-sm mb-4" role="alert">
                {error}
              </p>
            )}

            <Label htmlFor="email" className="mb-2 block">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="h-11 text-base mb-4"
            />

            <Label htmlFor="password" className="mb-2 block">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="h-11 text-base mb-6"
            />

            <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            <Link to="/" className="text-indigo-600 font-medium hover:underline">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}