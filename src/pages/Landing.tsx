import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Package, ShieldCheck, BarChart3, Users, Search, Bell } from 'lucide-react'
import InventoryShowcase from '../components/landing/InventoryShowcase'
import { useAuth } from '../hooks/useAuth'

const features = [
  {
    icon: Package,
    title: 'Real-Time Inventory Tracking',
    description: 'Add, edit, and track stock levels instantly. Know exactly what you have, always.',
  },
  {
    icon: Bell,
    title: 'Low-Stock Alerts',
    description: 'Automatic flags when items hit your reorder threshold, so you never run out unexpectedly.',
  },
  {
    icon: Search,
    title: 'Powerful Search & Filtering',
    description: 'Find any item instantly by name, SKU, or category, with sortable columns for fast reporting.',
  },
  {
    icon: BarChart3,
    title: 'Live Stats & Charts',
    description: 'See total stock value, item counts, and category breakdowns at a glance.',
  },
  {
    icon: Users,
    title: 'Role-Based Access',
    description: 'Give staff limited access while admins retain full control, with secure permissions enforced end-to-end.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure & Auditable',
    description: 'Every action is logged. Suspend accounts instantly if needed. Built on enterprise-grade infrastructure.',
  },
]

const DEMO_EMAIL = 'amabaah45@gmail.com'
const DEMO_PASSWORD = '78945612'

export default function Landing() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [demoLoading, setDemoLoading] = useState(false)

  async function handleTryDemo() {
    setDemoLoading(true)
    const { error } = await signIn(DEMO_EMAIL, DEMO_PASSWORD)
    setDemoLoading(false)

    if (!error) {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Package size={16} className="text-white" />
          </div>
          <h1 className="text-lg font-bold text-gray-900">Inventory Dashboard</h1>
        </div>
        <Link
          to="/login"
          className="text-sm font-medium text-white bg-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Sign In
        </Link>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-white">
        <div className="max-w-5xl mx-auto text-center px-6 pt-20 pb-16">
          <span className="inline-block text-xs font-semibold text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full mb-6">
            Built for small & mid-sized businesses
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Stop guessing what's{' '}
            <span className="text-indigo-600">in stock.</span>
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            A simple, secure inventory management system that tracks stock, manages
            your team, and keeps you ahead of shortages, all from one dashboard.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="mailto:andrewsdanyo93@gmail.com?subject=Inventory Dashboard Inquiry"
              className="inline-block bg-indigo-600 text-white px-7 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
            >
              Get Started
            </a>
            <button
              onClick={handleTryDemo}
              disabled={demoLoading}
              className="inline-block bg-white text-indigo-700 border border-indigo-200 px-7 py-3 rounded-lg font-medium hover:bg-indigo-50 transition-colors disabled:opacity-50"
            >
              {demoLoading ? 'Loading demo...' : 'Try Live Demo'}
            </button>
          </div>

          {/* Real-photo showcase */}
          <div className="mt-16 max-w-4xl mx-auto">
            <InventoryShowcase />
          </div>

          {/* Demo visual — stylized dashboard mockup */}
          <div className="mt-8 max-w-4xl mx-auto">
            <div className="rounded-xl border border-gray-200 shadow-2xl shadow-gray-200/60 overflow-hidden bg-white">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>

              <div className="p-6 text-left bg-gray-50">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <p className="text-xs text-gray-400 mb-1">Total Items</p>
                    <p className="text-xl font-bold text-gray-900">248</p>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <p className="text-xs text-gray-400 mb-1">Inventory Value</p>
                    <p className="text-xl font-bold text-gray-900">GHS 41,200</p>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <p className="text-xs text-gray-400 mb-1">Low Stock</p>
                    <p className="text-xl font-bold text-red-500">6</p>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                  <div className="flex items-end gap-2 h-20">
                    {[40, 65, 30, 80, 55, 70, 45].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-indigo-500 rounded-t"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4 space-y-2">
                  {['Blue Pen (PEN-001)', 'A4 Paper Ream (PPR-014)', 'USB-C Cable (USB-208)'].map(
                    (item) => (
                      <div
                        key={item}
                        className="flex justify-between items-center text-sm text-gray-600 border-b border-gray-100 last:border-0 pb-2 last:pb-0"
                      >
                        <span>{item}</span>
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                          In Stock
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Everything you need to run your inventory
          </h3>
          <p className="text-gray-500">No clutter. Just the tools that matter.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div key={feature.title} className="text-left">
                <div className="w-11 h-11 rounded-lg bg-indigo-50 flex items-center justify-center mb-4">
                  <Icon size={20} className="text-indigo-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{feature.title}</h4>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-600">
        <div className="max-w-3xl mx-auto text-center px-6 py-16">
          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Ready to get your inventory under control?
          </h3>
          <p className="text-indigo-100 mb-8">
            Get in touch and I'll set up a version tailored to your business.
          </p>
          <a
            href="mailto:andrewsdanyo93@gmail.com?subject=Inventory Dashboard Inquiry"
            className="inline-block bg-white text-indigo-700 px-7 py-3 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
          >
            Contact Me
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-8 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} Inventory Dashboard. Built by Andrews Danyo.</p>
      </footer>
    </div>
  )
}