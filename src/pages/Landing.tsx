import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Truck, Phone, Sun, Moon } from 'lucide-react'
import samdamLogo from '../assets/landing/samdamlogo.png'
import furnitureAccessoriesPhoto from '../assets/landing/sam 7.jpeg'
import toolsAdhesivesPhoto from '../assets/landing/sam 5.jpeg'
import wheelbarrowPhoto from '../assets/landing/Wheelbarrow.jpg'
import doorLocksPhoto from '../assets/landing/door locks.jpg'
import doorLocksWithHandlesPhoto from '../assets/landing/door lock with handles.jpg'
import doorLockPhoto from '../assets/landing/door lock.jpg'
import doorHandlePhoto from '../assets/landing/door handle.jpg'
import heroSlide1 from '../assets/landing/sam roll.jpg'
import heroSlide2 from '../assets/landing/sam screw.jpg'
import heroSlide3 from '../assets/landing/brush sam.jpg'
import heroSlide4 from '../assets/landing/paint sam 1.jpg'
import heroSlide5 from '../assets/landing/paint sam.jpg'
import heroSlide6 from '../assets/landing/panit.jpg'
import heroSlide7 from '../assets/landing/plywod sam.jpg'
import heroSlide8 from '../assets/landing/sam nail.jpg'
import managerPhoto from '../assets/landing/deborah.jpg'
import shopPhoto from '../assets/landing/the shop.jpeg'
import homeCharmPaint from '../assets/landing/Home charm paint.jpeg'
import homeCharmPaint1 from '../assets/landing/Home charm paint 1.jpeg'
import homeCharmPaint2 from '../assets/landing/Home charm paint 2.jpeg'
import flamingoPaint from '../assets/landing/Flammingo paint .jpeg'
import fineNestPaint from '../assets/landing/fine nest paint.jpeg'
import laylandPaint from '../assets/landing/layland paint.jpeg'
import laylandPaintRange from '../assets/landing/lay land paint.jpeg'

const heroSlides = [
  shopPhoto,
  heroSlide1,
  heroSlide2,
  heroSlide3,
  heroSlide4,
  heroSlide5,
  heroSlide6,
  heroSlide7,
  heroSlide8,
]

const paintProducts = [
  { image: homeCharmPaint, name: 'Home Charm Emulsion' },
  { image: homeCharmPaint1, name: 'Home Charm Paint' },
  { image: homeCharmPaint2, name: 'Home Charm Paint Range' },
  { image: flamingoPaint, name: 'Flamingo Paint' },
  { image: fineNestPaint, name: 'Fine Nest Paint' },
  { image: laylandPaint, name: 'Layland Paint' },
  { image: laylandPaintRange, name: 'Layland Paint Range' },
]

const hardwareProducts = [
  { image: doorLocksPhoto, name: 'Door Lock Display' },
  { image: doorLocksWithHandlesPhoto, name: 'Door Locks with Handles' },
  { image: doorLockPhoto, name: 'Door Locks' },
  { image: doorHandlePhoto, name: 'Door Handles' },
]

function HeroSlider({ images }: { images: string[] }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % images.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [images.length])

  return (
    <div className="relative max-w-5xl mx-auto overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl shadow-indigo-100/60 dark:shadow-none">
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {images.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`Sam-Dam Ventures store photo ${i + 1}`}
            className="block h-64 sm:h-96 w-full shrink-0 object-cover"
            style={{ objectPosition: src === shopPhoto ? 'center top' : 'center' }}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}
        aria-label="Previous photo"
        className="absolute left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={() => setIndex((i) => (i + 1) % images.length)}
        aria-label="Next photo"
        className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
      >
        ›
      </button>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Go to photo ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

const categories = [
  {
    image: heroSlide7,
    title: 'Building Materials',
    description: 'Wire mesh, roofing sheets, nails, plywood, laminate plywood, wall panels, and Formica sheets.',
  },
  {
    image: furnitureAccessoriesPhoto,
    title: 'Furniture & Kitchen Accessories',
    description: 'PVC edges, kick boards, kitchen legs, wardrobe bars, assorted sliding wardrobe bars, and aluminium glass profiles.',
  },
  {
    image: doorLocksWithHandlesPhoto,
    title: 'Hardware & Fittings',
    description: 'Door locks, lock-and-handle sets, door and cabinet handles, assorted cabinet hinges, screws, PVC Veneer, and cabinet accessories.',
  },
  {
    image: toolsAdhesivesPhoto,
    title: 'Tools & Adhesives',
    description: 'Professional tools and assorted glues, including Top Bond.',
  },
  {
    image: wheelbarrowPhoto,
    title: 'Wheelbarrows',
    description: 'Wheelbarrows for construction, site work, and material handling.',
  },
]

const whyUs = [
  {
    title: 'Quality Guaranteed',
    description: 'We sell strong, durable products you can rely on.',
  },
  {
    title: 'Affordable Prices',
    description: 'Get quality materials at prices that work for your project.',
  },
  {
    title: 'One-Stop Shop',
    description: 'Find everything for building and furniture work in one place.',
  },
  {
    title: 'Customer Support',
    description: 'Our team can help you choose the right materials for your project.',
  },
]

const faqs = [
  {
    q: 'Do you sell in bulk for contractors?',
    a: 'Yes. We supply both individual customers and contractors, with bulk quantities available on request.',
  },
  {
    q: 'Can I check if an item is in stock before I visit?',
    a: 'Reach out on WhatsApp or by phone and our team can confirm stock and pricing before you make the trip.',
  },
  {
    q: 'Do you deliver?',
    a: "Delivery is available depending on order size and location — get in touch and we'll work out the details.",
  },
  {
    q: 'What forms of payment do you accept?',
    a: 'We accept cash and mobile money. Ask our team for details when placing your order.',
  },
]

export default function Landing() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false
    return document.documentElement.classList.contains('dark')
  })

  const toggleTheme = () => {
    const nextIsDark = !isDark
    setIsDark(nextIsDark)
    document.documentElement.classList.toggle('dark', nextIsDark)
    document.documentElement.style.colorScheme = nextIsDark ? 'dark' : 'light'
    localStorage.setItem('theme_mode', nextIsDark ? 'dark' : 'light')
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-950/90 backdrop-blur border-b border-gray-100 dark:border-slate-800/80 px-6 py-4 flex items-center justify-between">
        <div className="flex min-w-0 items-center">
          <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-center" style={{ backgroundColor: '#ffffff' }}>
            <img
              src={samdamLogo}
              alt="Sam-Dam Ventures"
              className="h-8 sm:h-10 w-auto max-w-[180px] sm:max-w-[220px] object-contain object-left"
            />
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <a href="#home" className="text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Home</a>
          <a href="#products" className="text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Products</a>
          <a href="#why-us" className="text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Why Us</a>
          <a href="#about" className="text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">About</a>
          <a href="#contact" className="text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Contact</a>
        </nav>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 rounded-lg border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-gray-600 dark:text-slate-300" />}
          </button>
          <Link
            to="/login"
            className="text-sm font-medium text-white bg-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Staff Sign In
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section id="home" className="relative overflow-hidden bg-linear-to-b from-indigo-50/80 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-950">
        <div className="max-w-5xl mx-auto text-center px-6 pt-20 pb-16">
          <span className="inline-block text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-100/80 dark:bg-indigo-950/80 border border-indigo-200/60 dark:border-indigo-800/60 px-3 py-1 rounded-full mb-6">
            Based in Accra, Ghana
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
            Sam-Dam Ventures
          </h2>
          <p className="text-xl font-semibold text-indigo-700 dark:text-indigo-300 mb-4 max-w-3xl mx-auto">
            Your One-Stop Shop for Building Materials, Plywood and Furniture Hardware
          </p>
          <p className="text-lg text-gray-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
            From foundation to finishing, we supply quality building materials, woodwork accessories, and professional tools at the best prices.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <a
              href="#contact"
              className="inline-block bg-indigo-600 text-white px-7 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
            >
              Contact Us
            </a>
            <a
              href="#products"
              className="inline-block bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-slate-800 px-7 py-3 rounded-lg font-medium hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
            >
              See What We Sell
            </a>
          </div>

          <HeroSlider images={heroSlides} />
        </div>
      </section>

      {/* Products */}
      <section id="products" className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Our Products
          </h3>
          <p className="text-gray-500 dark:text-slate-400">Quality materials for every stage of your build.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <div
              key={category.title}
              className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
            >
              <img
                src={category.image}
                alt={category.title}
                className="block h-44 w-full object-cover"
              />
              <div className="p-5">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{category.title}</h4>
                <p className="text-sm text-gray-600 dark:text-slate-400">{category.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-16">
          <div className="mb-6">
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white">Paints &amp; Finishes</h4>
            <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">A look at paint brands and products available at Sam-Dam Ventures.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {paintProducts.map((product) => (
              <figure key={product.name}>
                <img
                  src={product.image}
                  alt={`${product.name} at Sam-Dam Ventures`}
                  className="block aspect-[3/4] w-full object-cover"
                />
                <figcaption className="pt-2 text-sm font-medium text-gray-700 dark:text-slate-300">{product.name}</figcaption>
              </figure>
            ))}
          </div>
        </div>
        <div className="mt-16">
          <div className="mb-6">
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white">Door Locks &amp; Handles</h4>
            <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">Explore door-lock and handle options available at Sam-Dam Ventures.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {hardwareProducts.map((product) => (
              <figure key={product.name}>
                <img
                  src={product.image}
                  alt={`${product.name} at Sam-Dam Ventures`}
                  className="block aspect-[3/4] w-full object-cover"
                />
                <figcaption className="pt-2 text-sm font-medium text-gray-700 dark:text-slate-300">{product.name}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section id="why-us" className="border-y border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/40">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="mb-12 max-w-2xl">
            <h3 className="mb-4 text-2xl font-bold text-slate-950 dark:text-white sm:text-3xl">
              Why Buy From Us?
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {whyUs.map((item) => (
              <div key={item.title} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="max-w-4xl mx-auto px-6 py-20 border-t border-gray-100 dark:border-slate-800">
        <div className="text-center mb-12">
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            About Sam-Dam Ventures
          </h3>
          <p className="text-gray-600 dark:text-slate-300 text-sm max-w-2xl mx-auto">
            Sam-Dam Ventures is a trusted supplier of building materials and furniture accessories in Ghana. We provide contractors, carpenters, interior decorators, and homeowners with durable and affordable products to get every job done right.
          </p>
          <p className="mt-4 text-gray-600 dark:text-slate-300 text-sm max-w-2xl mx-auto">
            Whether you are building a house, fitting a kitchen, or furnishing a wardrobe, we have everything you need under one roof, from roofing sheets and plywood to cabinet handles and hinges.
          </p>
          <p className="mt-4 font-semibold text-gray-900 dark:text-white text-sm">
            Quality, Affordability, and Reliable Service.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 p-6 max-w-md mx-auto">
          <img
            src={managerPhoto}
            alt="Mrs Deborah Amoh-Mensah"
            className="h-20 w-20 rounded-full object-cover shrink-0"
          />
          <div className="text-center sm:text-left">
            <p className="font-semibold text-gray-900 dark:text-white">(Mrs) Deborah Amoh-Mensah</p>
            <p className="text-sm text-gray-600 dark:text-slate-400">Manager, Sam-Dam Ventures</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 py-20 border-t border-gray-100 dark:border-slate-800">
        <div className="text-center mb-12">
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Frequently asked questions
          </h3>
        </div>
        <div className="space-y-6">
          {faqs.map((item) => (
            <div key={item.q} className="border-b border-gray-100 dark:border-slate-800 pb-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{item.q}</h4>
              <p className="text-sm text-gray-600 dark:text-slate-400">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Visit Us */}
      <section id="visit-us" className="border-t border-gray-100 dark:border-slate-800">
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-8 px-6 py-16 md:grid-cols-2 md:gap-12">
          <img
            src={shopPhoto}
            alt="Sam-Dam Ventures shop in Adenta-Frafraha"
            className="block aspect-[4/5] w-full object-cover object-top"
          />
          <div>
            <p className="mb-3 text-sm font-semibold uppercase text-indigo-700 dark:text-indigo-300">Visit Us</p>
            <h3 className="mb-8 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Find Our Shop</h3>
            <div className="space-y-6">
              <div>
                <h4 className="mb-1 font-semibold text-gray-900 dark:text-white">Location</h4>
                <p className="text-gray-600 dark:text-slate-300">Adenta-Frafraha, Accra, Ghana<br />Dodowa Road</p>
              </div>
              <div>
                <h4 className="mb-1 font-semibold text-gray-900 dark:text-white">Working Hours</h4>
                <p className="text-gray-600 dark:text-slate-300">Monday to Saturday<br />6:30 am to 5 pm</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA / Contact */}
      <section id="contact" className="bg-indigo-600 dark:bg-indigo-700">
        <div className="max-w-3xl mx-auto text-center px-6 py-16">
          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Need materials for your next project?
          </h3>
          <p className="text-indigo-100 mb-8">
            Get in touch and our team will help you find what you need.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="https://wa.me/233244683371"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 border border-transparent dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-slate-800 px-7 py-3 rounded-lg font-medium transition-colors"
            >
              <Phone size={16} />
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-slate-800 px-6 py-10 text-center text-sm text-gray-400 dark:text-slate-500">
        <p className="mb-2 flex items-center justify-center gap-1.5">
          <Truck size={14} /> Based in Accra, Ghana
        </p>
        <p className="mb-4">Sam-Dam Ventures - Dealers in wheelbarrows, roofing sheets, plywood, Formica, PVC edges, kitchen and wardrobe accessories, door locks, cabinet hinges and handles, screws, glues, and tools.</p>
        <p className="mb-4">© {new Date().getFullYear()} Sam-Dam Ventures.</p>
        <p className="text-xs text-gray-300 dark:text-slate-600">
          Inventory system built by{' '}
          <a
            href="mailto:andrewsdanyo93@gmail.com?subject=Inventory system inquiry"
            className="hover:text-gray-500 dark:hover:text-slate-400 transition-colors underline"
          >
            Andrews Danyo
          </a>
        </p>
      </footer>
    </div>
  )
}