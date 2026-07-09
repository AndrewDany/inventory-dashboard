import { Menu } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export default function Header({
  onMenuClick,
  title,
}: {
  onMenuClick: () => void
  title: string
}) {
  const { session, signOut } = useAuth()

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden text-gray-600 p-1"
          aria-label="Toggle sidebar"
        >
          <Menu size={22} />
        </button>
        <h1 className="text-lg sm:text-xl font-bold text-gray-900">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <p className="text-sm text-gray-600 hidden sm:block">{session?.user.email}</p>
        <button
          onClick={signOut}
          className="text-sm text-red-600 hover:underline"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}