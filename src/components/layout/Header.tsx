import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, LogOut, Sun, Moon } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useProfile } from '../../hooks/useProfile'
import NotificationCenter from '../notifications/NotificationCenter'
import { useLanguage } from '@/contexts/LanguageContext'
import samdamLogo from '../../assets/landing/samdamlogo.png'

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

  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false
    return document.documentElement.classList.contains('dark')
  })

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  function toggleTheme() {
    const nextIsDark = !isDark
    setIsDark(nextIsDark)
    document.documentElement.classList.toggle('dark', nextIsDark)
    document.documentElement.style.colorScheme = nextIsDark ? 'dark' : 'light'
    localStorage.setItem('theme_mode', nextIsDark ? 'dark' : 'light')
  }

  const role = profile?.role ?? 'staff'
  const userEmail = session?.user.email ?? profile?.email ?? ''
  const userName = userEmail ? userEmail.split('@')[0] : 'User'
  const initials = userName.slice(0, 2).toUpperCase()

  const roleBadgeConfig = {
    admin: { label: 'Admin', bg: 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800', dot: 'bg-indigo-500' },
    staff: { label: 'Staff Member', bg: 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500' },
    demo: { label: 'Demo', bg: 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800', dot: 'bg-amber-500' },
  }[role] || { label: role, bg: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700', dot: 'bg-slate-400' }

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-2xs">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="md:hidden text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Toggle sidebar"
        >
          <Menu size={18} />
        </button>
        <Link to="/dashboard" className="md:hidden flex items-center shrink-0">
          <div className="bg-white px-2 py-1 rounded-lg shadow-2xs border border-slate-200/80 flex items-center justify-center">
            <img
              src={samdamLogo}
              alt="Samdam Logo"
              className="h-6 w-auto max-w-[110px] object-contain object-left"
            />
          </div>
        </Link>
        <div className="flex items-center gap-2.5 min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 truncate tracking-tight">{t(title)}</h1>
          <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border shadow-2xs bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-4">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-center"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle dark mode"
        >
          {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-slate-600" />}
        </button>

        <NotificationCenter />

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

        <div className="hidden sm:flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 dark:bg-indigo-600 text-xs font-bold text-white shadow-2xs">
            {initials}
          </div>
          <div className="leading-tight text-left">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 capitalize truncate max-w-[140px]">{userName}</p>
            <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.2 text-[10px] font-medium border ${roleBadgeConfig.bg}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${roleBadgeConfig.dot}`} />
              {roleBadgeConfig.label}
            </span>
          </div>
        </div>

        <button
          onClick={signOut}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition border border-transparent hover:border-rose-100 dark:hover:border-rose-900/50"
          title="Sign out"
        >
          <LogOut size={15} />
          <span className="hidden md:inline">{t('Sign out')}</span>
        </button>
      </div>
    </header>
  )
}
