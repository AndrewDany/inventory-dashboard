import { Menu, LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useProfile } from '../../hooks/useProfile'
import NotificationCenter from '../notifications/NotificationCenter'
import { useLanguage } from '@/contexts/LanguageContext'

export default function Header({
  onMenuClick,
  title,
}: {
  onMenuClick: () => void
  title: string
}) {
  const { session, signOut } = useAuth()
  const { data: profile } = useProfile()
  const { t } = useLanguage()

  const role = profile?.role ?? 'staff'
  const userEmail = session?.user.email ?? profile?.email ?? ''
  const userName = userEmail ? userEmail.split('@')[0] : 'User'
  const initials = userName.slice(0, 2).toUpperCase()

  const roleBadgeConfig = {
    admin: { label: 'Admin', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' },
    staff: { label: 'Staff Member', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    demo: { label: 'Demo', bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  }[role] || { label: role, bg: 'bg-slate-50 text-slate-700 border-slate-200', dot: 'bg-slate-400' }

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-2xs">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="md:hidden text-slate-600 hover:text-slate-900 p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition"
          aria-label="Toggle sidebar"
        >
          <Menu size={18} />
        </button>
        <div className="flex items-center gap-2.5 min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate tracking-tight">{t(title)}</h1>
          <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border shadow-2xs bg-slate-50 text-slate-600 border-slate-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-4">
        <NotificationCenter />

        <div className="h-4 w-px bg-slate-200 hidden sm:block" />

        <div className="hidden sm:flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white shadow-2xs">
            {initials}
          </div>
          <div className="leading-tight text-left">
            <p className="text-xs font-semibold text-slate-900 capitalize truncate max-w-[140px]">{userName}</p>
            <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.2 text-[10px] font-medium border ${roleBadgeConfig.bg}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${roleBadgeConfig.dot}`} />
              {roleBadgeConfig.label}
            </span>
          </div>
        </div>

        <button
          onClick={signOut}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition border border-transparent hover:border-rose-100"
          title="Sign out"
        >
          <LogOut size={15} />
          <span className="hidden md:inline">{t('Sign out')}</span>
        </button>
      </div>
    </header>
  )
}
