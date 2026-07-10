import { Link } from 'react-router-dom'
import { Package, ShieldCheck, BarChart3, Users, Search, Bell } from 'lucide-react'

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

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Inventory Dashboard</h1>
        <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900">
          Sign In
        </Link>
      </header>

      <section className="max-w-4xl mx-auto text-center px-6 py-20">
        <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Stop guessing what's in stock.
        </h2>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          A simple, secure inventory management system built for small and mid-sized
          businesses. Track stock, manage your team, and stay ahead of shortages,
          all from one dashboard.
        </p>
        <a
          href="mailto:andrewsdanyo93@gmail.com?subject=Inventory Dashboard Inquiry"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Get Started
        </a>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-gray-100">
        <h3 className="text-2xl font-bold text-gray-900 text-center mb-12">
          Everything you need to run your inventory
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div key={feature.title} className="text-left">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
                  <Icon size={20} className="text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{feature.title}</h4>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="max-w-3xl mx-auto text-center px-6 py-16 border-t border-gray-100">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          Ready to get your inventory under control?
        </h3>
        <p className="text-gray-600 mb-8">
          Get in touch and I'll set up a version tailored to your business.
        </p>
        <a
          href="mailto:andrewsdanyo93@gmail.com?subject=Inventory Dashboard Inquiry"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Contact Me
        </a>
      </section>

      <footer className="border-t border-gray-200 px-6 py-8 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} Inventory Dashboard. Built by Andrews Danyo.</p>
      </footer>
    </div>
  )
}