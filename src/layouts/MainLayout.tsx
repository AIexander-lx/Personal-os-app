import { useEffect, useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { clsx } from 'clsx'
import { NavBar } from '@/components/common'
import ToastHost from '@/components/ToastHost'
import { useUserStore, useCourseStore, useGamificationStore } from '@/store'

/** Reevalúa los logros ante cualquier cambio relevante de datos. */
function useAchievementWatcher() {
  const evaluate = useGamificationStore((s) => s.evaluate)
  const userSig = useUserStore(
    (s) =>
      `${s.user.totalXP}|${s.user.streak}|${s.user.sessions}|${s.gym.length}|${s.sleep.length}|${s.energy.length}|${s.githubCommits}|${s.peersHelped}`,
  )
  const courseSig = useCourseStore((s) =>
    s.courses
      .map((c) => c.topics.reduce((a, t) => a + (t.completedExercises ?? 0), 0))
      .join(','),
  )
  useEffect(() => {
    evaluate()
  }, [evaluate, userSig, courseSig])
}

const mobileLinks = [
  { to: '/', label: 'Inicio', icon: '🏠', end: true },
  { to: '/roadmap', label: 'Roadmap', icon: '🗺️' },
  { to: '/study', label: 'Study', icon: '⏱️' },
  { to: '/streakstudy', label: 'Streak', icon: '🚀' },
  { to: '/health', label: 'Salud', icon: '💪' },
  { to: '/career', label: 'Carrera', icon: '🧭' },
]

export function MainLayout() {
  const [open, setOpen] = useState(false)
  useAchievementWatcher()

  return (
    <div className="mx-auto flex min-h-screen max-w-[1400px]">
      {/* Sidebar desktop */}
      <div className="sticky top-0 hidden h-screen shrink-0 border-r border-surface-border/50 lg:block">
        <NavBar />
      </div>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="absolute left-0 top-0 h-full w-72 border-r border-surface-border/60 bg-surface"
            onClick={(e) => e.stopPropagation()}
          >
            <NavBar />
          </div>
        </div>
      )}

      <div className="flex w-full flex-col">
        {/* Topbar mobile */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-surface-border/50 bg-surface/80 px-4 py-3 backdrop-blur lg:hidden">
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg border border-surface-border/60 p-2 text-slate-200"
            aria-label="Abrir menú"
          >
            ☰
          </button>
          <span className="text-sm font-bold text-slate-100">Personal OS</span>
          <span className="w-9" />
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>

        {/* Bottom nav mobile */}
        <nav className="sticky bottom-0 z-30 grid grid-cols-6 border-t border-surface-border/50 bg-surface/90 backdrop-blur lg:hidden">
          {mobileLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center gap-0.5 py-2 text-[10px]',
                  isActive ? 'text-accent' : 'text-slate-400',
                )
              }
            >
              <span className="text-base">{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <ToastHost />
    </div>
  )
}

export default MainLayout
