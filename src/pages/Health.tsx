import { useMemo, useState } from 'react'
import { clsx } from 'clsx'
import { Card, StatBox, ProgressBar } from '@/components/common'
import { useUserStore } from '@/store'
import {
  format,
  startOfWeek,
  addDays,
  subDays,
  parseISO,
  isWeekend,
  getDaysInMonth,
  isSameMonth,
} from 'date-fns'
import { es } from 'date-fns/locale'

function BarChart({
  data,
  max,
  unit,
  color,
}: {
  data: { label: string; value: number }[]
  max: number
  unit: string
  color: string
}) {
  return (
    <div className="flex h-40 items-end gap-2">
      {data.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-[10px] text-muted">{d.value || ''}</span>
          <div className="flex w-full flex-1 items-end">
            <div
              className={clsx('w-full rounded-t-md transition-all duration-500', color)}
              style={{ height: `${max ? (d.value / max) * 100 : 0}%`, minHeight: d.value ? 4 : 0 }}
              title={`${d.value} ${unit}`}
            />
          </div>
          <span className="text-[10px] text-muted-2">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function Health() {
  const gym = useUserStore((s) => s.gym)
  const sleep = useUserStore((s) => s.sleep)
  const energy = useUserStore((s) => s.energy)
  const toggleGym = useUserStore((s) => s.toggleGym)
  const logSleep = useUserStore((s) => s.logSleep)
  const logEnergy = useUserStore((s) => s.logEnergy)

  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const gymDone = (key: string) => gym.find((g) => g.date === key)?.done ?? false

  // Racha de gym (días laborables consecutivos hacia atrás).
  const gymStreak = useMemo(() => {
    let streak = 0
    let cursor = today
    for (let i = 0; i < 60; i++) {
      if (isWeekend(cursor)) {
        cursor = subDays(cursor, 1)
        continue
      }
      const key = format(cursor, 'yyyy-MM-dd')
      if (gymDone(key)) streak++
      else if (format(cursor, 'yyyy-MM-dd') !== format(today, 'yyyy-MM-dd')) break
      cursor = subDays(cursor, 1)
    }
    return streak
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gym])

  // % gym del mes (sobre días laborables transcurridos).
  const gymMonthPct = useMemo(() => {
    const daysInMonth = getDaysInMonth(today)
    let weekdaysElapsed = 0
    let done = 0
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(today.getFullYear(), today.getMonth(), d)
      if (date > today) break
      if (isWeekend(date)) continue
      weekdaysElapsed++
      if (gymDone(format(date, 'yyyy-MM-dd'))) done++
    }
    return weekdaysElapsed ? Math.round((done / weekdaysElapsed) * 100) : 0
  }, [gym, today])

  const gymMonthCount = gym.filter(
    (g) => g.done && isSameMonth(parseISO(g.date), today),
  ).length

  // Series 7 días.
  const last7 = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i))
  const sleepData = last7.map((d) => {
    const key = format(d, 'yyyy-MM-dd')
    return { label: format(d, 'EEEEE', { locale: es }), value: sleep.find((s) => s.date === key)?.hours ?? 0 }
  })
  const energyData = last7.map((d) => {
    const key = format(d, 'yyyy-MM-dd')
    return { label: format(d, 'EEEEE', { locale: es }), value: energy.find((e) => e.date === key)?.level ?? 0 }
  })

  const avgSleep = sleep.length
    ? (sleep.reduce((s, x) => s + x.hours, 0) / sleep.length).toFixed(1)
    : '—'
  const avgQuality = sleep.length
    ? (sleep.reduce((s, x) => s + x.quality, 0) / sleep.length).toFixed(1)
    : '—'

  // Formulario de hoy.
  const todayKeyStr = format(today, 'yyyy-MM-dd')
  const [sleepHours, setSleepHours] = useState(7.5)
  const [sleepQuality, setSleepQuality] = useState(7)
  const todayEnergy = energy.find((e) => e.date === todayKeyStr)?.level ?? 0

  return (
    <div className="space-y-6">
      <header className="animate-fade-in">
        <h1 className="text-2xl font-bold text-fg sm:text-3xl">Salud & energía</h1>
        <p className="text-sm text-muted">Gym 06:00–08:00 · sueño · energía</p>
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatBox label="Racha gym" value={`${gymStreak} 🔥`} icon="💪" accent="amber" hint="días laborables" />
        <StatBox label="Gym este mes" value={`${gymMonthPct}%`} icon="📅" accent="emerald" hint={`${gymMonthCount} sesiones`} />
        <StatBox label="Sueño prom." value={avgSleep} icon="😴" accent="violet" hint={`calidad ${avgQuality}/10`} />
        <StatBox label="Energía hoy" value={todayEnergy ? `${todayEnergy}/10` : '—'} icon="⚡" accent="cyan" hint="actualiza cada mañana" />
      </section>

      <Card title="Registro de gym" subtitle="Lun a Vie · inamovible" icon="🏋️">
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((d) => {
            const key = format(d, 'yyyy-MM-dd')
            const weekend = isWeekend(d)
            const done = gymDone(key)
            const isToday = key === todayKeyStr
            return (
              <button
                key={key}
                disabled={weekend}
                onClick={() => toggleGym(key)}
                className={clsx(
                  'flex flex-col items-center gap-1 rounded-lg border p-2 text-center transition-colors',
                  weekend && 'cursor-not-allowed border-surface-border/30 bg-elevated/40 opacity-50',
                  !weekend && done && 'border-emerald-500/40 bg-emerald-500/15',
                  !weekend && !done && 'border-surface-border/50 bg-elevated/40 hover:bg-elevated',
                  isToday && 'ring-1 ring-accent',
                )}
              >
                <span className="text-[10px] uppercase text-muted">
                  {format(d, 'EEE', { locale: es })}
                </span>
                <span className="text-sm font-semibold text-fg">{format(d, 'd')}</span>
                <span className="text-lg">{weekend ? '🌙' : done ? '✅' : '⬜'}</span>
              </button>
            )
          })}
        </div>
        <div className="mt-3">
          <ProgressBar value={gymMonthPct} label="Completitud del mes" showValue gradient="green" />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Sueño" subtitle="Últimos 7 días (horas)" icon="😴">
          <BarChart data={sleepData} max={10} unit="h" color="bg-gradient-to-t from-violet-500 to-fuchsia-400" />
          <form
            className="mt-4 flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              logSleep(todayKeyStr, sleepHours, sleepQuality)
            }}
          >
            <label className="text-xs text-muted">
              Horas
              <input
                type="number"
                step="0.5"
                min={0}
                max={14}
                value={sleepHours}
                onChange={(e) => setSleepHours(Number(e.target.value))}
                className="mt-1 block w-20 rounded-lg border border-surface-border/60 bg-input/60 px-2 py-1.5 text-sm text-fg focus:border-accent focus:outline-none"
              />
            </label>
            <label className="text-xs text-muted">
              Calidad: <span className="text-fg">{sleepQuality}/10</span>
              <input
                type="range"
                min={1}
                max={10}
                value={sleepQuality}
                onChange={(e) => setSleepQuality(Number(e.target.value))}
                className="mt-2 block w-40 accent-violet-400"
              />
            </label>
            <button className="rounded-lg bg-violet-500/15 px-3 py-1.5 text-sm font-medium text-violet-700 dark:text-violet-300 hover:bg-violet-500/25">
              Guardar hoy
            </button>
          </form>
        </Card>

        <Card title="Energía" subtitle="Últimos 7 días (1–10)" icon="⚡">
          <BarChart data={energyData} max={10} unit="/10" color="bg-gradient-to-t from-cyan-500 to-blue-400" />
          <div className="mt-4">
            <p className="mb-2 text-xs text-muted">¿Cómo te sientes hoy?</p>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => logEnergy(todayKeyStr, n)}
                  className={clsx(
                    'h-9 w-9 rounded-lg text-sm font-medium transition-colors',
                    todayEnergy === n
                      ? 'bg-accent/25 text-accent ring-1 ring-accent'
                      : 'bg-elevated text-muted hover:bg-control',
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
