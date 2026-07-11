import { useState, useEffect } from 'react'
import warehouseTeam from '../../assets/landing/warehouse-team.jpg'
import electrician from '../../assets/landing/electrician.jpg'
import serverTech from '../../assets/landing/server-tech.jpg'
import tabletCheck from '../../assets/landing/tablet-check.jpg'
import shelfCheck from '../../assets/landing/shelf-check.jpg'
import forkliftTeam from '../../assets/landing/forklift-team.jpg'
import clipboardWorker from '../../assets/landing/clipboard-worker.jpg'
import warehouseScan from '../../assets/landing/warehouse-scan.jpg'

const slides = [
  { image: warehouseTeam, heading: 'Built for real teams', sub: 'From the warehouse floor to the front office.' },
  { image: electrician, heading: 'Every trade, every asset', sub: 'Track tools, parts, and equipment with precision.' },
  { image: serverTech, heading: 'Reliable, secure infrastructure', sub: 'Your data, protected and always available.' },
  { image: tabletCheck, heading: 'Check stock from anywhere', sub: 'Update inventory right from the shelf.' },
  { image: shelfCheck, heading: 'Know what you have, instantly', sub: 'No more manual counts or guesswork.' },
  { image: forkliftTeam, heading: 'Built for busy operations', sub: 'Keep every team member aligned on stock levels.' },
  { image: clipboardWorker, heading: 'Confidence in every count', sub: 'Accurate records your whole team can trust.' },
  { image: warehouseScan, heading: 'From shelf to system', sub: 'Scan, update, and sync in real time.' },
]

const SLIDE_DURATION = 3500

export default function InventoryShowcase() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length)
    }, SLIDE_DURATION)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative w-full h-[420px] rounded-lg overflow-hidden border border-gray-200 bg-gray-900">
      <div
        className="flex h-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${(active * 100) / slides.length}%)`, width: `${slides.length * 100}%` }}
      >
        {slides.map((slide) => (
          <div key={slide.image} className="relative h-full shrink-0" style={{ width: `${100 / slides.length}%` }}>
            <img
              src={slide.image}
              alt={slide.heading}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/45" />
            <div className="absolute bottom-0 left-0 right-0 p-8 text-left">
              <h4 className="text-white text-xl sm:text-2xl font-medium mb-2 tracking-tight">
                {slide.heading}
              </h4>
              <p className="text-gray-200 text-sm max-w-md font-light">{slide.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-3">
        {slides.map((_, i) => (
          <div key={i} className="flex-1 h-[2px] bg-white/20 overflow-hidden">
            {i === active && (
              <div
                key={`progress-${active}`}
                className="h-full bg-white"
                style={{ animation: `progressBar ${SLIDE_DURATION}ms linear forwards` }}
              />
            )}
            {i < active && <div className="h-full bg-white w-full" />}
          </div>
        ))}
      </div>
    </div>
  )
}