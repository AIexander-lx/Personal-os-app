import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { clsx } from 'clsx'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Card, ProgressBar } from '@/components/common'
import DailyGoals from '@/components/DailyGoals'
import MonthlyGoals from '@/components/MonthlyGoals'
import { useTodayBlocks } from '@/components/DaySchedule'
import AreaProgress from '@/components/AreaProgress'
import { useUserStore, useGamificationStore, usePlanStore } from '@/store'
import { toMinutes } from '@/data/schedule'
import {
  getLevelInfo,
  levelProgress,
  xpToNextLevel,
  xpDaily,
  xpStreak,
  dayCodeOf,
  weekStartKey,
  formatDuration,
  timeAgo,
  REVIEW_XP,
  LEVELS,
} from '@/utils'

function greeting(hour: number) {
  if (hour < 12) return 'Buen día'
  if (hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

/** Nivel, XP hacia el siguiente, XP de hoy y racha. */
function LevelCard() {
  const user = useUserStore((s) => s.user)
  const xpLog = useUserStore((s) => s.xpLog)
  const level = getLevelInfo(user.totalXP)
  const next = LEVELS.find((l) => l.level === level.level + 1)
  const todayXP = useMemo(() => xpDaily(xpLog, new Date(), 1)[0].value, [xpLog])
  const streak = useMemo(() => xpStreak(xpLog), [xpLog])

  return (
    <Card className="lg:col-span-2">
      <div className="flex flex-wrap items-center gap-5">
        <div className="relative grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 shadow-lg shadow-orange-500/20">
          <span className="font-mono text-3xl font-black text-white drop-shadow">{level.level}</span>
          <span className="absolute -bottom-2 rounded-full bg-surface-raised px-2 py-0.5 text-[10px] font-semibold text-fg-soft ring-1 ring-surface-border">
            NIVEL
          </span>
        </div>

        <div className="min-w-[12rem] flex-1">
          <p className="text-xs uppercase tracking-wider text-muted">Nivel {level.level} de 10</p>
          <p className="text-xl font-bold text-fg">{level.title}</p>
          <ProgressBar className="mt-2" value={levelProgress(user.totalXP)} gradient="accent" />
          <p className="mt-1 font-mono text-xs text-muted">
            {user.totalXP.toLocaleString('es-PE')} XP
            {next ? ` · faltan ${xpToNextLevel(user.totalXP)} para ${next.title}` : ' · nivel máximo'}
          </p>
        </div>

        <div className="flex gap-3 sm:flex-col">
          <div className="rounded-lg bg-accent/10 px-3 py-2 text-center">
            <p className="font-mono text-lg font-bold text-accent">⚡ +{todayXP}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted">XP hoy</p>
          </div>
          <div className="rounded-lg bg-amber-500/10 px-3 py-2 text-center">
            <p className="font-mono text-lg font-bold text-amber-700 dark:text-amber-300">🔥 {streak}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted">{streak === 1 ? 'día de racha' : 'días de racha'}</p>
          </div>
        </div>
      </div>
    </Card>
  )
}

/** Bloque del horario en el que estás ahora (o el siguiente). */
function NowCard() {
  const { nowMin, current, next } = useTodayBlocks()
  const block = current ?? next

  return (
    <Card
      title={current ? 'Ahora' : 'Siguiente'}
      icon="⏱️"
      action={
        <Link to="/agenda" className="text-xs text-accent hover:underline">
          Ver agenda →
        </Link>
      }
    >
      {block ? (
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent/10 text-2xl">{block.icon}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-fg">{block.label}</p>
            <p className="font-mono text-xs text-muted">
              {block.start}–{block.end}
              {current
                ? ` · termina en ${formatDuration(toMinutes(current.end) - nowMin)}`
                : ` · empieza en ${formatDuration(Math.max(0, toMinutes(block.start) - nowMin))}`}
            </p>
            {current && <ProgressBar className="mt-2" value={current.progress} size="sm" gradient="accent" />}
          </div>
        </div>
      ) : (
        <p className="py-2 text-sm text-muted">Día completado · a descansar 😴</p>
      )}
      {current && next && (
        <p className="mt-3 truncate text-xs text-muted-2">
          Después: {next.icon} {next.label} · {next.start}
        </p>
      )}
    </Card>
  )
}

/** Barras con el XP ganado cada día de los últimos 30. */
function XPBars() {
  const xpLog = useUserStore((s) => s.xpLog)
  const days = useMemo(() => xpDaily(xpLog), [xpLog])
  const max = Math.max(1, ...days.map((d) => d.value))
  const total = days.reduce((s, d) => s + d.value, 0)

  return (
    <Card
      title="XP · últimos 30 días"
      subtitle="Plan, diario, checklist y logros"
      icon="📈"
      action={<span className="badge bg-accent/10 font-mono text-accent">+{total.toLocaleString('es-PE')}</span>}
    >
      <div className="flex h-36 items-end gap-[3px]">
        {days.map((d, i) => (
          <div
            key={d.key}
            title={`${d.label}: +${d.value} XP`}
            className={clsx(
              'flex-1 rounded-t-sm transition-all duration-500',
              i === days.length - 1 ? 'bg-accent' : 'bg-accent/45 hover:bg-accent/70',
            )}
            style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value ? 4 : 2, opacity: d.value ? 1 : 0.25 }}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted-2">
        <span>{days[0].label}</span>
        <span>{days[15].label}</span>
        <span>hoy</span>
      </div>
    </Card>
  )
}

const QUICK_LINKS = [
  { to: '/plan', label: 'Plan', hint: 'Fase y metas', icon: '🎯', tile: 'bg-violet-500/15' },
  { to: '/estudios', label: 'Estudios', hint: 'Cursos y temas', icon: '🎓', tile: 'bg-cyan-500/15' },
  { to: '/finanzas?tab=trading', label: 'Diario', hint: 'Trading', icon: '📒', tile: 'bg-amber-500/15' },
  { to: '/agenda', label: 'Agenda', hint: 'Clases y evaluaciones', icon: '📅', tile: 'bg-emerald-500/15' },
]

function QuickLinks() {
  return (
    <Card title="Accesos rápidos" icon="⚡">
      <div className="grid grid-cols-2 gap-2">
        {QUICK_LINKS.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="flex items-center gap-3 rounded-lg border border-surface-border/50 bg-elevated/40 p-3 transition-colors hover:border-accent/40 hover:bg-elevated"
          >
            <span className={clsx('grid h-9 w-9 shrink-0 place-items-center rounded-lg text-lg', l.tile)}>{l.icon}</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-fg">{l.label}</p>
              <p className="truncate text-[11px] text-muted">{l.hint}</p>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  )
}

function Achievements() {
  const achievements = useGamificationStore((s) => s.achievements)
  const [showAll, setShowAll] = useState(false)
  const unlocked = achievements
    .filter((a) => a.unlocked)
    .sort((a, b) => (b.unlockedAt ?? '').localeCompare(a.unlockedAt ?? ''))
  const recent = unlocked.length ? unlocked.slice(0, 3) : achievements.slice(0, 3)

  return (
    <Card
      title={unlocked.length ? 'Logros recientes' : 'Primeros logros'}
      subtitle={`${unlocked.length}/${achievements.length} desbloqueados`}
      icon="🏅"
      action={
        <button onClick={() => setShowAll((v) => !v)} className="text-xs text-accent hover:underline">
          {showAll ? 'Ocultar' : 'Ver todos'}
        </button>
      }
    >
      <div className="space-y-2">
        {recent.map((a) => (
          <div key={a.id} className="flex items-center gap-3 rounded-lg bg-elevated/50 p-2">
            <span className={clsx('text-xl', !a.unlocked && 'opacity-40 grayscale')}>{a.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-fg">{a.name}</p>
              <p className="truncate text-[11px] text-muted-2">
                {a.unlocked && a.unlockedAt ? timeAgo(a.unlockedAt) : a.description}
              </p>
            </div>
            <span className="badge bg-accent/10 font-mono text-accent">+{a.xp}</span>
          </div>
        ))}
      </div>

      {showAll && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {achievements.map((a) => (
            <div
              key={a.id}
              title={a.description}
              className={clsx(
                'flex items-center gap-2 rounded-lg border p-2',
                a.unlocked ? 'border-accent/30 bg-accent/5' : 'border-surface-border/40 bg-elevated/30',
              )}
            >
              <span className={clsx('text-lg', !a.unlocked && 'opacity-40 grayscale')}>{a.icon}</span>
              <p className={clsx('truncate text-xs', a.unlocked ? 'text-fg' : 'text-muted')}>{a.name}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export default function Dashboard() {
  const user = useUserStore((s) => s.user)
  const reviews = usePlanStore((s) => s.reviews)
  const now = new Date()

  // Domingo sin revisión registrada → recordatorio.
  const reviewPending =
    dayCodeOf(now) === 'SU' && !reviews.some((r) => r.weekStart === weekStartKey(now))

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-fg sm:text-3xl">
            ¡{greeting(now.getHours())}, {user.name}!
          </h1>
          <p className="text-sm text-muted">Disciplina hoy, libertad mañana.</p>
        </div>
        <p className="badge bg-control/60 text-fg-soft first-letter:uppercase">
          {format(now, "EEEE d 'de' MMMM", { locale: es })}
        </p>
      </header>

      {reviewPending && (
        <Link
          to="/revision"
          className="flex items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 transition-colors hover:bg-amber-500/15 animate-fade-in"
        >
          <span className="text-2xl">🧭</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-fg">Hoy toca la revisión semanal</p>
            <p className="text-xs text-muted">18:00–19:00 · registra tus indicadores de la semana (+{REVIEW_XP} XP)</p>
          </div>
          <span className="text-sm text-amber-700 dark:text-amber-300">Ir →</span>
        </Link>
      )}

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <LevelCard />
        <NowCard />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DailyGoals />
        <MonthlyGoals linkToPage />
        <AreaProgress />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <XPBars />
        <QuickLinks />
        <Achievements />
      </section>
    </div>
  )
}
