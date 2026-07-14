import { useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { clsx } from 'clsx'
import { useUserStore } from '@/store'
import { useToastStore } from '@/store/toastStore'
import {
  getLevelInfo,
  levelProgress,
  formatXP,
  exportData,
  importData,
  STORE_KEYS,
} from '@/utils'
import ProgressBar from './ProgressBar'

const links = [
  { to: '/', label: 'Dashboard', icon: '🏠', end: true },
  { to: '/roadmap', label: 'Roadmap', icon: '🗺️' },
  { to: '/study', label: 'Study', icon: '⏱️' },
  { to: '/streakstudy', label: 'StreakStudy', icon: '🚀' },
  { to: '/health', label: 'Salud', icon: '💪' },
  { to: '/career', label: 'Carrera', icon: '🧭' },
]

export function NavBar() {
  const user = useUserStore((s) => s.user)
  const level = getLevelInfo(user.totalXP)
  const pushToast = useToastStore((s) => s.push)
  const [confirming, setConfirming] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleReset = () => {
    STORE_KEYS.forEach((k) => localStorage.removeItem(k))
    // Recarga completa para re-inicializar todos los stores desde sus defaults en 0.
    window.location.href = '/'
  }

  const handleExport = () => {
    const filename = exportData()
    pushToast({ icon: '⬇️', title: 'Backup exportado', description: filename })
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // permite reimportar el mismo archivo
    if (!file) return
    try {
      await importData(file)
      // Recarga para rehidratar los stores desde los datos restaurados.
      window.location.href = '/'
    } catch (err) {
      pushToast({
        icon: '⚠️',
        title: 'No se pudo importar',
        description: err instanceof Error ? err.message : 'Archivo inválido.',
      })
    }
  }

  return (
    <aside className="flex h-full w-full flex-col gap-6 p-4 lg:w-64">
      <div className="flex items-center gap-3 px-2">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent/15 text-accent shadow-glow">
          <span className="text-lg font-black">P</span>
        </div>
        <div>
          <p className="text-sm font-bold leading-none text-slate-100">Personal OS</p>
          <p className="text-[11px] text-slate-400">Centro de control</p>
        </div>
      </div>

      <div className="card-surface p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-100">{user.name}</p>
            <p className="text-[11px] text-slate-400">
              Nivel {level.level} · {level.title}
            </p>
          </div>
          <span className="badge bg-accent/10 text-accent">{formatXP(user.totalXP)}</span>
        </div>
        <ProgressBar
          className="mt-3"
          value={levelProgress(user.totalXP)}
          size="sm"
          gradient="accent"
        />
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) => clsx('nav-link', isActive && 'nav-link-active')}
          >
            <span className="text-base">{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-2 px-2">
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex-1 rounded-lg border border-surface-border/60 px-2 py-1.5 text-xs text-slate-300 transition-colors hover:border-accent/50 hover:text-accent"
          >
            ⬇️ Exportar
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex-1 rounded-lg border border-surface-border/60 px-2 py-1.5 text-xs text-slate-300 transition-colors hover:border-accent/50 hover:text-accent"
          >
            ⬆️ Importar
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImport}
          />
        </div>

        {confirming ? (
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="flex-1 rounded-lg bg-rose-500/15 px-2 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/25"
            >
              Sí, borrar todo
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="w-full rounded-lg border border-surface-border/60 px-2 py-1.5 text-xs text-slate-400 transition-colors hover:border-rose-500/40 hover:text-rose-300"
          >
            ↺ Reiniciar datos
          </button>
        )}
      </div>

      <p className="px-2 text-[11px] leading-relaxed text-slate-500">
        UTEC · Ing. de Sistemas · Ciclo 4
        <br />
        Vacaciones hasta 10 ago 2026
      </p>
    </aside>
  )
}

export default NavBar
