import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Card, StatBox, ProgressBar } from '@/components/common'
import DaySchedule from '@/components/DaySchedule'
import { useUserStore, useCourseStore, useGamificationStore } from '@/store'
import {
  getLevelInfo,
  levelProgress,
  xpToNextLevel,
  formatXP,
  courseProgress,
} from '@/utils'
import { subDays, format, parseISO, isAfter } from 'date-fns'

/** Área/sparkline simple en SVG a partir de una serie de valores. */
function XPChart({ points }: { points: { label: string; value: number }[] }) {
  const w = 640
  const h = 180
  const pad = 8
  const max = Math.max(1, ...points.map((p) => p.value))
  const stepX = (w - pad * 2) / Math.max(1, points.length - 1)
  const coords = points.map((p, i) => {
    const x = pad + i * stepX
    const y = h - pad - (p.value / max) * (h - pad * 2)
    return [x, y] as const
  })
  const line = coords.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${coords[coords.length - 1][0].toFixed(1)},${h - pad} L${pad},${h - pad} Z`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-44 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="xpFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#xpFill)" />
      <path d={line} fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinejoin="round" />
      {coords.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === coords.length - 1 ? 4 : 0} fill="#22d3ee" />
      ))}
    </svg>
  )
}

export default function Dashboard() {
  const user = useUserStore((s) => s.user)
  const sessions = useUserStore((s) => s.sessions)
  const courses = useCourseStore((s) => s.courses)
  const achievements = useGamificationStore((s) => s.achievements)

  const level = getLevelInfo(user.totalXP)

  // Serie XP acumulada de los últimos 30 días.
  const chart = useMemo(() => {
    const today = new Date()
    const days = Array.from({ length: 30 }, (_, i) => subDays(today, 29 - i))
    // XP base antes de la ventana: total actual menos lo ganado en la ventana.
    const windowStart = subDays(today, 30)
    const inWindow = sessions.filter((s) => isAfter(parseISO(s.date), windowStart))
    const windowXP = inWindow.reduce((s, x) => s + x.xp, 0)
    let cumulative = user.totalXP - windowXP
    return days.map((d) => {
      const key = format(d, 'yyyy-MM-dd')
      const dayXP = inWindow
        .filter((s) => s.date.slice(0, 10) === key)
        .reduce((s, x) => s + x.xp, 0)
      cumulative += dayXP
      return { label: format(d, 'd/M'), value: cumulative }
    })
  }, [sessions, user.totalXP])

  const unlockedCount = achievements.filter((a) => a.unlocked).length
  const nearAchievements = achievements.filter((a) => !a.unlocked).slice(0, 3)

  return (
    <div className="space-y-6">
      <header className="animate-fade-in">
        <p className="text-sm text-muted">Buen día, capitán 👋</p>
        <h1 className="text-2xl font-bold text-fg sm:text-3xl">
          Dashboard · {level.title}
        </h1>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatBox label="Total XP" value={user.totalXP.toLocaleString('es-PE')} icon="⚡" accent="cyan" hint={`${xpToNextLevel(user.totalXP)} XP al siguiente nivel`} />
        <StatBox label="Nivel" value={`${level.level}/10`} icon="🎖️" accent="violet" hint={level.title} />
        <StatBox label="Racha" value={`${user.streak} 🔥`} icon="📅" accent="amber" hint="días consecutivos" />
        <StatBox label="Sesiones" value={user.sessions} icon="✅" accent="emerald" hint={`${sessions.length} registradas aquí`} />
      </section>

      {/* Bloque de día */}
      <DaySchedule />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* XP chart */}
        <Card
          className="lg:col-span-2"
          title="Progreso de XP"
          subtitle="Últimos 30 días (acumulado)"
          icon="📈"
          action={<span className="badge bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">{formatXP(user.totalXP)}</span>}
        >
          <XPChart points={chart} />
          <div className="mt-1 flex justify-between text-[10px] text-muted-2">
            <span>{chart[0]?.label}</span>
            <span>hoy</span>
          </div>
        </Card>

        {/* Próximos hitos */}
        <Card title="Próximos hitos" subtitle="Nivel y logros" icon="🎯">
          <div className="mb-4">
            <ProgressBar
              value={levelProgress(user.totalXP)}
              label={`Nivel ${level.level} → ${level.level + 1}`}
              showValue
              gradient="violet"
            />
            <p className="mt-1 text-xs text-muted">
              Faltan <span className="font-semibold text-fg">{xpToNextLevel(user.totalXP)} XP</span>
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Logros por desbloquear
            </p>
            {nearAchievements.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-lg bg-elevated/50 p-2">
                <span className="text-lg opacity-70 grayscale">{a.icon}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm text-fg">{a.name}</p>
                  <p className="truncate text-[11px] text-muted-2">{a.description}</p>
                </div>
                <span className="ml-auto badge bg-control/60 text-fg-soft">+{a.xp}</span>
              </div>
            ))}
            <p className="pt-1 text-[11px] text-muted-2">
              {unlockedCount}/{achievements.length} logros desbloqueados
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Course stats */}
        <Card className="lg:col-span-2" title="Progreso por curso" subtitle="Ciclo 4 · 6 cursos" icon="📚">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {courses.map((c) => {
              const p = courseProgress(c)
              return (
                <div key={c.id}>
                  <div className="mb-1 flex items-center gap-2 text-sm">
                    <span>{c.icon}</span>
                    <span className="truncate text-fg">{c.name}</span>
                  </div>
                  <ProgressBar
                    value={p}
                    showValue
                    size="sm"
                    gradient={p >= 100 ? 'green' : 'accent'}
                  />
                </div>
              )
            })}
          </div>
        </Card>

        {/* Quick actions */}
        <Card title="Acciones rápidas" subtitle="Atajos del día" icon="⚡">
          <div className="space-y-3">
            <Link
              to="/study"
              className="flex items-center gap-3 rounded-lg bg-accent/10 p-3 text-accent transition-colors hover:bg-accent/20"
            >
              <span className="text-lg">⏱️</span>
              <div>
                <p className="text-sm font-semibold">Iniciar sesión de estudio</p>
                <p className="text-[11px] text-cyan-900 dark:text-cyan-200/70">Timer Pomodoro + XP en vivo</p>
              </div>
            </Link>
            <Link
              to="/health"
              className="flex items-center gap-3 rounded-lg bg-elevated/60 p-3 text-fg transition-colors hover:bg-elevated"
            >
              <span className="text-lg">💪</span>
              <div>
                <p className="text-sm font-semibold">Registrar gym</p>
                <p className="text-[11px] text-muted">06:00–08:00 · Lun a Vie</p>
              </div>
            </Link>
            <Link
              to="/streakstudy"
              className="flex items-center gap-3 rounded-lg bg-elevated/60 p-3 text-fg transition-colors hover:bg-elevated"
            >
              <span className="text-lg">🚀</span>
              <div>
                <p className="text-sm font-semibold">Avanzar StreakStudy</p>
                <p className="text-[11px] text-muted">Features y bugs del proyecto</p>
              </div>
            </Link>
          </div>
        </Card>
      </div>

      {/* Logros */}
      <Card
        title="Logros"
        subtitle="Desbloquéalos usando la app"
        icon="🏅"
        action={
          <span className="badge bg-control/60 text-fg-soft">
            {unlockedCount}/{achievements.length}
          </span>
        }
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {achievements.map((a) => (
            <div
              key={a.id}
              title={a.description}
              className={
                'flex items-center gap-2 rounded-lg border p-2.5 ' +
                (a.unlocked
                  ? 'border-accent/30 bg-accent/5'
                  : 'border-surface-border/40 bg-elevated/30')
              }
            >
              <span className={'text-xl ' + (a.unlocked ? '' : 'opacity-40 grayscale')}>
                {a.icon}
              </span>
              <div className="min-w-0">
                <p
                  className={
                    'truncate text-xs font-medium ' +
                    (a.unlocked ? 'text-fg' : 'text-muted')
                  }
                >
                  {a.name}
                </p>
                <p className="text-[10px] text-muted-2">
                  {a.unlocked ? `Desbloqueado · +${a.xp}` : `+${a.xp} XP`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
