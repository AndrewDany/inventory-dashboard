import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Package, ShieldCheck, BarChart3, Users, Search, Bell } from 'lucide-react'
import InventoryShowcase from '../components/landing/InventoryShowcase'
import { useAuth } from '../hooks/useAuth'
import profilePhoto from '../assets/landing/profile.jpg'

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
    console.log('Attempting demo login with:', JSON.stringify(DEMO_EMAIL), JSON.stringify(DEMO_PASSWORD))
    const { error } = await signIn(DEMO_EMAIL, DEMO_PASSWORD)
    console.log('Demo login result:', error)
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

      {/* Pricing */}
      <section className="max-w-5xl mx-auto px-6 py-20 border-t border-gray-100">
        <div className="text-center mb-14">
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Simple, transparent pricing
          </h3>
          <p className="text-gray-500">One-time setup. No hidden fees.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: 'Starter',
              price: 'GHS 1,500',
              desc: 'For a single shop or small business',
              features: ['Inventory CRUD & search', 'Basic dashboard & stats', '1 admin account', 'Hosted & deployed'],
              highlight: false,
            },
            {
              name: 'Business',
              price: 'GHS 3,500',
              desc: 'For a growing team',
              features: ['Everything in Starter', 'Role-based access', 'Activity logs & stock tracking', 'Custom branding'],
              highlight: true,
            },
            {
              name: 'Custom',
              price: 'Quote on request',
              desc: 'For specific business needs',
              features: ['Everything in Business', 'Custom fields & workflows', 'Third-party integrations', 'Priority support'],
              highlight: false,
            },
          ].map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl p-6 border ${
                tier.highlight
                  ? 'border-indigo-600 shadow-lg shadow-indigo-100 bg-white relative'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {tier.highlight && (
                <span className="absolute -top-3 left-6 bg-indigo-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                  Most Popular
                </span>
              )}
              <h4 className="font-semibold text-gray-900 mb-1">{tier.name}</h4>
              <p className="text-sm text-gray-500 mb-4">{tier.desc}</p>
              <p className="text-2xl font-bold text-gray-900 mb-6">{tier.price}</p>
              <ul className="space-y-2 mb-6">
                {tier.features.map((f) => (
                  <li key={f} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-indigo-600 mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="mailto:andrewsdanyo93@gmail.com?subject=Inventory Dashboard Inquiry"
                className={`block text-center text-sm font-medium py-2.5 rounded-lg transition-colors ${
                  tier.highlight
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Get Started
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-5xl mx-auto px-6 py-20 border-t border-gray-100">
        <div className="text-center mb-14">
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            How it works
          </h3>
          <p className="text-gray-500">From first message to a live system, in three steps.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center mx-auto mb-4 font-bold">
              1
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Tell me what you need</h4>
            <p className="text-sm text-gray-600">
              A quick conversation about your business, your team, and how you currently track stock.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center mx-auto mb-4 font-bold">
              2
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">I build & customize it</h4>
            <p className="text-sm text-gray-600">
              Your own version, set up with your categories, your branding, and your team's accounts.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center mx-auto mb-4 font-bold">
              3
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">You're live in days</h4>
            <p className="text-sm text-gray-600">
              Start tracking stock immediately, with support from me whenever you need it.
            </p>
          </div>
        </div>
      </section>

      {/* About the Developer */}
      <section className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <img
              src={profilePhoto}
              alt="Andrews Danyo"
              className="w-24 h-24 rounded-full object-cover shrink-0 border-2 border-indigo-100"
            />
            <div className="text-center sm:text-left">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Built by Andrews Danyo</h3>
              <p className="text-gray-600 text-sm mb-4">
                A software developer based in Ghana, focused on building practical tools for small
                and mid-sized businesses. I hold a B.Sc. in Information Technology from Ghana
                Communication Technology University, with hands-on experience in IT support and
                systems administration. This project reflects how I build: simple, secure, and
                genuinely useful for the people running the business day to day.
              </p>
              <a
                href="mailto:andrewsdanyo93@gmail.com"
                className="text-indigo-600 text-sm font-medium hover:underline"
              >
                andrewsdanyo93@gmail.com
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 py-20 border-t border-gray-100">
        <div className="text-center mb-12">
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Frequently asked questions
          </h3>
        </div>
        <div className="space-y-6">
          {[
            {
              q: 'How long does setup take?',
              a: 'Most businesses are up and running within a few days, depending on how much customization you need (custom fields, branding, staff accounts).',
            },
            {
              q: 'Do I need technical skills to use it?',
              a: "No. If you can use email or WhatsApp, you can use this. It's built to be simple for non-technical staff.",
            },
            {
              q: 'Is my data safe?',
              a: 'Yes. Your data is hosted on secure, enterprise-grade infrastructure with encrypted connections, role-based access, and full activity logging.',
            },
            {
              q: 'Can I request changes after it launches?',
              a: 'Absolutely. I offer ongoing support and can add features or adjust the system as your business grows.',
            },
            {
              q: 'What if my team is not tech-savvy?',
              a: "That's exactly who this was built for. Staff accounts are limited to simple actions, add stock, view inventory, so there's little room for mistakes.",
            },
          ].map((item) => (
            <div key={item.q} className="border-b border-gray-100 pb-6">
              <h4 className="font-semibold text-gray-900 mb-2">{item.q}</h4>
              <p className="text-sm text-gray-600">{item.a}</p>
            </div>
          ))}
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
      <footer className="border-t border-gray-100 px-6 py-10 text-center text-sm text-gray-400">
        <p className="mb-2">Based in Accra, Ghana</p>
        <div className="flex items-center justify-center gap-4 mb-4">
          <a href="mailto:andrewsdanyo93@gmail.com" className="hover:text-gray-600 transition-colors">
            Email
          </a>
          <a
            href="https://www.linkedin.com/in/andrews-danyo-2a61181b5/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-600 transition-colors"
          >
            LinkedIn
          </a>
        </div>
        <p>© {new Date().getFullYear()} Inventory Dashboard. Built by Andrews Danyo.</p>
      </footer>
    </div>
  )
}