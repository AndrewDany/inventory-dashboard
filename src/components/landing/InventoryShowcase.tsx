import { useState, useEffect } from 'react'
import { Bell, ShieldCheck, TrendingUp } from 'lucide-react'

const scenes = [
  {
    image: 'https://source.unsplash.com/1200x700/?warehouse,shelves',
    heading: 'Track every item, in real time',
    sub: 'From raw materials to finished stock, always know what you have.',
    badge: { icon: TrendingUp, label: '248 items tracked', color: 'bg-indigo-600' },
  },
  {
    image: 'https://source.unsplash.com/1200x700/?boxes,storage',
    heading: 'Never get caught off guard',
    sub: 'Automatic alerts fire the moment stock hits your reorder point.',
    badge: { icon: Bell, label: 'Low stock: 6 items', color: 'bg-red-500' },
  },
  {
    image: 'https://source.unsplash.com/1200x700/?retail,store',
    heading: 'Your team, safely in control',
    sub: 'Give staff exactly the access they need. Nothing more.',
    badge: { icon: ShieldCheck, label: 'Role-based access', color: 'bg-emerald-600' },
  },
]

const SCENE_DURATION = 4500

export default function InventoryShowcase() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % scenes.length)
    }, SCENE_DURATION)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative w-full h-[460px] rounded-xl overflow-hidden shadow-2xl shadow-gray-300/50 bg-gray-900">
      {scenes.map((scene, i) => {
        const Icon = scene.badge.icon
        const isActive = i === active

        return (
          <div
            key={scene.image}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {/* Background photo with Ken Burns zoom, restarts each time scene becomes active */}
            {isActive && (
              <img
                key={`img-${i}-${active}`}
                src={scene.image}
                alt={scene.heading}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ animation: `kenburns ${SCENE_DURATION + 1000}ms ease-in-out forwards` }}
              />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

            {/* Floating badge, top-right */}
            {isActive && (
              <div
                key={`badge-${i}-${active}`}
                className={`absolute top-6 right-6 flex items-center gap-2 ${scene.badge.color} text-white text-xs font-semibold px-3 py-2 rounded-full shadow-lg`}
                style={{
                  animation: `popIn 600ms ease-out 300ms both, floatBadge 3s ease-in-out 900ms infinite`,
                }}
              >
                <Icon size={14} />
                {scene.badge.label}
              </div>
            )}

            {/* Text content, bottom-left */}
            {isActive && (
              <div key={`text-${i}-${active}`} className="absolute bottom-0 left-0 right-0 p-8 text-left">
                <h4
                  className="text-white text-2xl sm:text-3xl font-bold mb-2"
                  style={{ animation: 'slideUpFade 600ms ease-out 150ms both' }}
                >
                  {scene.heading}
                </h4>
                <p
                  className="text-gray-200 text-sm max-w-md"
                  style={{ animation: 'slideUpFade 600ms ease-out 350ms both' }}
                >
                  {scene.sub}
                </p>
              </div>
            )}
          </div>
        )
      })}

      {/* Progress bars (one per scene, fills over the scene's duration) */}
      <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-3">
        {scenes.map((_, i) => (
          <div key={i} className="flex-1 h-1 bg-white/25 rounded-full overflow-hidden">
            {i === active && (
              <div
                key={`progress-${active}`}
                className="h-full bg-white rounded-full"
                style={{ animation: `progressBar ${SCENE_DURATION}ms linear forwards` }}
              />
            )}
            {i < active && <div className="h-full bg-white rounded-full w-full" />}
          </div>
        ))}
      </div>

      {/* Dot navigation */}
      <div className="absolute bottom-4 right-6 z-20 flex gap-2">
        {scenes.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === active ? 'bg-white' : 'bg-white/40'
            }`}
            aria-label={`Scene ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}