import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Package } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import loginPhoto from '../assets/landing/forklift-team.jpg'

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
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left: image panel */}
      <div className="relative hidden lg:block">
        <img
          src={loginPhoto}
          alt="Warehouse team managing inventory"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/90 via-indigo-950/40 to-indigo-950/10" />

        <div className="relative h-full flex flex-col justify-between p-10 text-white">
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
            <p className="text-indigo-100 text-sm">
              Sign in to track stock, manage orders, and keep your team aligned,
              all from one dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* Right: form panel */}
      <div className="flex items-center justify-center bg-gray-50 px-6 py-16">
        <div className="w-full max-w-sm">
          <Link
            to="/"
            className="lg:hidden flex items-center gap-2 mb-8 w-fit"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Package size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-900">Inventory Dashboard</span>
          </Link>

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
              className="mb-4"
            />

            <Label htmlFor="password" className="mb-2 block">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="mb-6"
            />

            <Button type="submit" className="w-full" disabled={loading}>
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