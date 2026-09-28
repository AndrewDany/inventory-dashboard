import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Truck, Phone } from 'lucide-react'
import samdamLogo from '../assets/landing/samdamlogo.png'
import sealantsPhoto from '../assets/landing/sam 5.jpeg'
import wallpaperPhoto from '../assets/landing/sam 6.jpeg'
import hardwarePhoto from '../assets/landing/sam 7.jpeg'
import chemicalsPhoto from '../assets/landing/sam 8.jpeg'
import heroSlide1 from '../assets/landing/sam roll.jpg'
import heroSlide2 from '../assets/landing/sam screw.jpg'
import heroSlide3 from '../assets/landing/brush sam.jpg'
import heroSlide4 from '../assets/landing/paint sam 1.jpg'
import heroSlide5 from '../assets/landing/paint sam.jpg'
import heroSlide6 from '../assets/landing/panit.jpg'
import heroSlide7 from '../assets/landing/plywod sam.jpg'
import heroSlide8 from '../assets/landing/sam nail.jpg'
import managerPhoto from '../assets/landing/deborah.jpg'

const heroSlides = [
  heroSlide1,
  heroSlide2,
  heroSlide3,
  heroSlide4,
  heroSlide5,
  heroSlide6,
  heroSlide7,
  heroSlide8,
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
    <div className="relative max-w-5xl mx-auto overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-indigo-100/60">
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {images.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`Samdam Ventures store photo ${i + 1}`}
            className="block h-64 sm:h-96 w-full shrink-0 object-cover"
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

// TODO: confirm these category names/descriptions match what you actually stock
const categories = [
  {
    image: hardwarePhoto,
    title: 'Hardware & Fittings',
    description: 'Locks, hinges, bolts, and fittings, sold by box, weight, or unit.',
  },
  {
    image: chemicalsPhoto,
    title: 'Adhesives & Chemicals',
    description: 'Wood glue, thinners, sealants, and specialty chemicals.',
  },
  {
    image: wallpaperPhoto,
    title: 'Wallpaper & Finishes',
    description: 'A wide range of wallpaper designs and finishing materials.',
  },
  {
    image: sealantsPhoto,
    title: 'Sealants & Tools',
    description: 'Spray paint, foam sealants, tape, and everyday tools.',
  },
]

const whyUs = [
  {
    title: 'One-stop shop',
    description: 'From cement to fittings, find everything your project needs under one roof.',
  },
  {
    title: 'Stock you can count on',
    description: "We track inventory in real time, so what's in stock is what's actually available.",
  },
  {
    title: 'Built for contractors',
    description: 'Bulk quantities, trade pricing, and fast turnaround for job sites big and small.',
  },
  {
    title: 'Straightforward service',
    description: 'Clear pricing, honest advice, and a team that knows the materials they sell.',
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
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex min-w-0 items-center">
          <img
            src={samdamLogo}
            alt="Samdam Ventures"
            className="h-10 w-auto max-w-47.5 object-contain object-left sm:h-12 sm:max-w-57.5"
          />
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <a href="#home" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">Home</a>
          <a href="#products" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">Products</a>
          <a href="#why-us" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">Why Us</a>
          <a href="#about" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">About</a>
          <a href="#contact" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">Contact</a>
        </nav>
        <Link
          to="/login"
          className="text-sm font-medium text-white bg-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Staff Sign In
        </Link>
      </header>

      {/* Hero */}
      <section id="home" className="relative overflow-hidden bg-linear-to-b from-indigo-50 via-white to-white">
        <div className="max-w-5xl mx-auto text-center px-6 pt-20 pb-16">
          <span className="inline-block text-xs font-semibold text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full mb-6">
            Based in Accra, Ghana
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Your one-stop shop for{' '}
            <span className="text-indigo-600">building materials.</span>
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Samdam Ventures supplies contractors, builders, and homeowners with quality
            construction materials, tools, and hardware, all in one place.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <a
              href="#contact"
              className="inline-block bg-indigo-600 text-white px-7 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
            >
              Contact Us
            </a>
            <a
              href="#products"
              className="inline-block bg-white text-indigo-700 border border-indigo-200 px-7 py-3 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
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
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            What we supply
          </h3>
          <p className="text-gray-500">Quality materials for every stage of your build.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {categories.map((category) => (
            <div
              key={category.title}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <img
                src={category.image}
                alt={category.title}
                className="block h-44 w-full object-cover"
              />
              <div className="p-5">
                <h4 className="font-semibold text-gray-900 mb-1">{category.title}</h4>
                <p className="text-sm text-gray-600">{category.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Us */}
      <section id="why-us" className="border-y border-slate-200 bg-slate-50/80">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="mb-12 max-w-2xl">
            <h3 className="mb-4 text-2xl font-bold text-slate-950 sm:text-3xl">
              Why builders choose Samdam Ventures
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {whyUs.map((item) => (
              <div key={item.title} className="rounded-xl border border-slate-200 bg-white p-6">
                <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
                <p className="text-sm text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="max-w-4xl mx-auto px-6 py-20 border-t border-gray-100">
        <div className="text-center mb-12">
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            About Samdam Ventures
          </h3>
          <p className="text-gray-600 text-sm max-w-2xl mx-auto">
            {/* TODO: replace with your real company story */}
            Samdam Ventures supplies construction materials, tools, and hardware to
            contractors, builders, and homeowners across the region. We're focused on
            keeping the right stock on hand and making it easy to get what you need,
            when you need it.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-6 max-w-md mx-auto">
          <img
            src={managerPhoto}
            alt="Deborah Peprah"
            className="h-20 w-20 rounded-full object-cover shrink-0"
          />
          <div className="text-center sm:text-left">
            <p className="font-semibold text-gray-900">Deborah Peprah</p>
            <p className="text-sm text-gray-600">Manager, Samdam Ventures</p>
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
          {faqs.map((item) => (
            <div key={item.q} className="border-b border-gray-100 pb-6">
              <h4 className="font-semibold text-gray-900 mb-2">{item.q}</h4>
              <p className="text-sm text-gray-600">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA / Contact */}
      <section id="contact" className="bg-indigo-600">
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
              className="inline-flex items-center gap-2 bg-white text-indigo-700 px-7 py-3 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
            >
              <Phone size={16} />
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-10 text-center text-sm text-gray-400">
        <p className="mb-2 flex items-center justify-center gap-1.5">
          <Truck size={14} /> Based in Accra, Ghana
        </p>
        <p className="mb-4">© {new Date().getFullYear()} Samdam Ventures.</p>
        <p className="text-xs text-gray-300">
          Inventory system built by{' '}
          <a
            href="mailto:andrewsdanyo93@gmail.com?subject=Inventory system inquiry"
            className="hover:text-gray-500 transition-colors underline"
          >
            Andrews Danyo
          </a>
        </p>
      </footer>
    </div>
  )
}