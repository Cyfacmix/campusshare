import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Bell, LogOut, Menu, Moon, Sun, X } from 'lucide-react'
import { gamification } from '../api'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../hooks/useTheme'
import { Avatar, Button } from './ui'
import { fullName } from '../utils/format'
import { useNavCounts } from '../hooks/useNavCounts'

const linkCls = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition ${isActive
    ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200'
    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`

function CountBadge({ n }) {
  if (!n) return null
  return (
    <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">
      {n > 99 ? '99+' : n}
      <span className="sr-only"> nouveau(x)</span>
    </span>
  )
}

export default function Layout() {
  const { user, isAuthenticated, isModerator, hasRole, logout } = useAuth()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const counts = useNavCounts()

  const unread = useQuery({
    queryKey: ['unread-count'],
    queryFn: gamification.unreadCount,
    enabled: isAuthenticated,
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
  })

  const links = (
    <>
      <NavLink to="/resources" className={linkCls} onClick={() => setOpen(false)}>Ressources<CountBadge n={counts.ressources} /></NavLink>
      <NavLink to="/questions" className={linkCls} onClick={() => setOpen(false)}>Questions<CountBadge n={counts.questions} /></NavLink>
      {isAuthenticated && <NavLink to="/me/dashboard" className={linkCls} onClick={() => setOpen(false)}>Mon espace</NavLink>}
      {isModerator && <NavLink to="/moderation" className={linkCls} onClick={() => setOpen(false)}>Modération<CountBadge n={counts.moderation} /></NavLink>}
      {hasRole('admin') && <NavLink to="/admin" className={linkCls} onClick={() => setOpen(false)}>Administration</NavLink>}
    </>
  )

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-brand-700 dark:text-brand-300">
            <img src="/logo.svg" alt="CampusShare" className="h-8 w-8" /> CampusShare
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Navigation principale">{links}</nav>

          <div className="flex items-center gap-2">
            <button onClick={toggle} aria-label="Changer de thème"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {isAuthenticated ? (
              <>
                <Link to="/notifications" aria-label="Notifications"
                  className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <Bell className="h-5 w-5" />
                  {unread.data?.count > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">
                      {unread.data.count > 99 ? '99+' : unread.data.count}
                    </span>
                  )}
                </Link>
                <Link to="/me" className="hidden items-center gap-2 sm:flex" aria-label="Mon profil">
                  <Avatar name={fullName(user)} src={user.avatar} size="sm" />
                </Link>
                <button onClick={async () => { await logout(); navigate('/') }} aria-label="Se déconnecter"
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Connexion</Button>
                <Button size="sm" onClick={() => navigate('/register')}>S&apos;inscrire</Button>
              </div>
            )}

            <button className="rounded-lg p-2 md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="flex flex-col gap-1 border-t border-slate-200 px-4 py-3 dark:border-slate-800 md:hidden">
            {links}
            {isAuthenticated
              ? <NavLink to="/me" className={linkCls} onClick={() => setOpen(false)}>Mon profil</NavLink>
              : (
                <>
                  <NavLink to="/login" className={linkCls} onClick={() => setOpen(false)}>Connexion</NavLink>
                  <NavLink to="/register" className={linkCls} onClick={() => setOpen(false)}>Inscription</NavLink>
                </>
              )}
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
