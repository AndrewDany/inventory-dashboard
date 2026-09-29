import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Eye, EyeOff } from 'lucide-react'
import loginPhoto from '../assets/landing/tablet-check.jpg'
import samdamLogo from '../assets/landing/samdamlogo.png'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Login() {
  const [email, setEmail] = useState(() => localStorage.getItem('remembered_email') || '')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('remember_me') === 'true')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    const trimmedEmail = email.trim()
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError('Please enter a valid email address.')
      return
    }

    if (rememberMe) {
      localStorage.setItem('remembered_email', trimmedEmail)
      localStorage.setItem('remember_me', 'true')
    } else {
      localStorage.removeItem('remembered_email')
      localStorage.removeItem('remember_me')
    }

    setLoading(true)

    const { error } = await signIn(trimmedEmail, password)

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:grid lg:grid-cols-2 bg-gray-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Photo panel: compact card on mobile, full-bleed split on desktop */}
      <div className="relative w-full max-w-md mx-auto mt-6 px-6 lg:px-0 lg:mt-0 lg:max-w-none lg:mx-0">
        <div className="relative h-48 sm:h-64 lg:h-full rounded-2xl lg:rounded-none overflow-hidden shadow-md lg:shadow-none">
          <img
            src={loginPhoto}
            alt="Warehouse worker checking stock on a tablet"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-br from-indigo-900/85 via-indigo-900/50 to-indigo-900/20" />

          <div className="relative h-full flex flex-col justify-end p-6 lg:p-10 text-white">
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
      <div className="flex items-center justify-center flex-1 bg-gray-50 dark:bg-slate-950 px-6 py-10 lg:py-16">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center text-center mb-6">
            <Link to="/" className="inline-flex justify-center mb-4 transition-transform hover:scale-105">
              <div className="bg-white px-4 py-2.5 rounded-2xl shadow-sm border border-slate-200/80 flex items-center justify-center" style={{ backgroundColor: '#ffffff' }}>
                <img
                  src={samdamLogo}
                  alt="Samdam Ventures"
                  className="h-12 sm:h-14 w-auto max-w-[240px] object-contain"
                />
              </div>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Welcome back</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">Sign in to your account to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
            {error && (
              <p className="text-red-600 dark:text-red-400 text-sm mb-4" role="alert">
                {error}
              </p>
            )}

            <Label htmlFor="email" className="mb-2 block text-gray-700 dark:text-slate-300">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoComplete="email"
              className="h-11 text-base mb-4"
            />

            <Label htmlFor="password" className="mb-2 block text-gray-700 dark:text-slate-300">Password</Label>
            <div className="relative mb-4">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="current-password"
                className="h-11 text-base pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 focus:outline-none"
              >
                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>

            <div className="flex items-center justify-between mb-6">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-slate-300 select-none">
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(!!checked)}
                  disabled={loading}
                />
                <span>Remember me</span>
              </label>
            </div>

            <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-slate-400 mt-6">
            <Link to="/" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}