import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { clsx } from 'clsx'
import { format, startOfWeek, addDays, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { Card, Ring } from '@/components/common'
import { applicableItems, useChecklistStore, useUserStore } from '@/store'
import { plan, TRAINING_DAYS } from '@/data/plan'
import { toMinutes } from '@/data/schedule'
import { dayCodeOf, trainingMonth, DAILY_ITEM_XP } from '@/utils'
import type { DayCode } from '@/types'

const DAY_NAMES: Record<DayCode, string> = {
  MO: 'lunes',
  TU: 'martes',
  WE: 'miércoles',
  TH: 'jueves',
  FR: 'viernes',
  SA: 'sábado',
  SU: 'domingo',
}
const trainingBlock = plan.weeklyBlocks.find((b) => b.category === 'salud')
const TRAINING_LABEL = [...TRAINING_DAYS].map((c) => DAY_NAMES[c]).join(' y ')

const keyOf = (d: Date) => format(d, 'yyyy-MM-dd')
const upperFirst = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)

/** Próximo entrenamiento sin marcar: hoy si aún no termina el bloque, si no el siguiente día programado. */
function nextTraining(now: Date, isDone: (key: string) => boolean): Date | null {
  const endMin = trainingBlock ? toMinutes(trainingBlock.end) : 24 * 60
  for (let i = 0; i < 8; i++) {
    const d = addDays(now, i)
    if (!TRAINING_DAYS.has(dayCodeOf(d)) || isDone(keyOf(d))) continue
    if (i === 0 && now.getHours() * 60 + now.getMinutes() >= endMin) continue
    return d
  }
  return null
}

function BarChart({ data, max, unit }: { data: { label: string; value: number }[]; max: number; unit: string }) {
  return (
    <div className="flex h-32 items-end gap-2">
      {data.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-[10px] text-muted">{d.value || ''}</span>
          <div className="flex w-full flex-1 items-end">
            <div
              className={clsx(
                'w-full rounded-t-md bg-gradient-to-t from-violet-500 to-fuchsia-400 transition-all duration-500',
                i === data.length - 1 && d.value > 0 && 'ring-1 ring-violet-300/60',
              )}
              style={{ height: `${max ? (d.value / max) * 100 : 0}%`, minHeight: d.value ? 4 : 0 }}
              title={`${d.value} ${unit}`}
            />
          </div>
          <span className="text-[10px] uppercase text-muted-2">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

/** Línea de 7 días (0-10); los días sin dato no cortan la línea, solo no tienen punto. */
function LineChart({ data }: { data: { label: string; value: number }[] }) {
  const w = 280
  const h = 110
  const pad = 10
  const stepX = (w - pad * 2) / Math.max(1, data.length - 1)
  const y = (v: number) => h - pad - (v / 10) * (h - pad * 2)
  const pts = data.map((d, i) => ({ x: pad + i * stepX, y: y(d.value), has: d.value > 0 }))
  const withData = pts.filter((p) => p.has)
  const line = withData.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-32 w-full" preserveAspectRatio="none">
        {[2.5, 5, 7.5].map((v) => (
          <line key={v} x1={pad} x2={w - pad} y1={y(v)} y2={y(v)} stroke="rgb(var(--line))" strokeDasharray="3 4" />
        ))}
        {withData.length > 1 && (
          <path d={line} fill="none" stroke="rgb(var(--accent))" strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        )}
        {withData.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="rgb(var(--accent))" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div className="flex justify-between px-1">
        {data.map((d, i) => (
          <span key={i} className="text-[10px] uppercase text-muted-2">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  )
}

function FutsalCard({ now }: { now: Date }) {
  const gym = useUserStore((s) => s.gym)
  const toggleGym = useUserStore((s) => s.toggleGym)
  const todayKey = keyOf(now)
  const isDone = (key: string) => gym.some((g) => g.date === key && g.done)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(now, { weekStartsOn: 1 }), i))
  const trainingThisWeek = weekDays.filter((d) => TRAINING_DAYS.has(dayCodeOf(d)))
  const doneThisWeek = trainingThisWeek.filter((d) => isDone(keyOf(d))).length
  const next = nextTraining(now, isDone)

  return (
    <Card className="lg:col-span-2">
      <div className="flex flex-wrap items-center gap-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-emerald-500/15 text-3xl">⚽</span>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold text-fg">
            Futsal <span className="text-sm font-normal text-muted">({upperFirst(TRAINING_LABEL)})</span>
          </p>
          <p className="text-sm text-muted">
            {next ? (
              <>
                Próximo entrenamiento:{' '}
                <span className="font-medium text-fg">
                  {keyOf(next) === todayKey ? 'hoy' : upperFirst(format(next, "EEEE d 'de' MMM", { locale: es }))}
                  {trainingBlock && ` · ${trainingBlock.start}`}
                </span>
              </>
            ) : (
              'Semana de entrenamientos completa 💪'
            )}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-2xl font-bold text-fg">
            {doneThisWeek}/{trainingThisWeek.length}
          </p>
          <p className="text-[11px] text-muted">esta semana</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-2">
        {weekDays.map((d) => {
          const key = keyOf(d)
          const isTraining = TRAINING_DAYS.has(dayCodeOf(d))
          const done = isDone(key)
          return (
            <button
              key={key}
              disabled={!isTraining}
              onClick={() => toggleGym(key)}
              className={clsx(
                'flex flex-col items-center gap-1 rounded-lg border p-2 text-center transition-colors',
                !isTraining && 'cursor-not-allowed border-surface-border/30 bg-elevated/30 opacity-40',
                isTraining && done && 'border-emerald-500/40 bg-emerald-500/15',
                isTraining && !done && 'border-surface-border/50 bg-elevated/40 hover:bg-elevated',
                key === todayKey && 'ring-1 ring-accent',
              )}
            >
              <span className="text-[10px] uppercase text-muted">{format(d, 'EEE', { locale: es })}</span>
              <span className="text-sm font-semibold text-fg">{format(d, 'd')}</span>
              <span className="text-base">{!isTraining ? '–' : done ? '✅' : '⬜'}</span>
            </button>
          )
        })}
      </div>
      <div className="mt-3 flex justify-between text-xs">
        <span className="text-muted">Toca un día de entrenamiento para marcarlo</span>
        <Link to="/agenda" className="text-accent hover:underline">
          Ver agenda →
        </Link>
      </div>
    </Card>
  )
}

function MonthRing({ now }: { now: Date }) {
  const gym = useUserStore((s) => s.gym)
  const m = useMemo(() => trainingMonth(TRAINING_DAYS, new Set(gym.filter((g) => g.done).map((g) => g.date)), now), [gym, now])
  const pct = m.elapsed ? (m.done / m.elapsed) * 100 : 0

  return (
    <Card title="Este mes" subtitle="Cumplimiento de entrenamientos" icon="📅">
      <div className="flex flex-col items-center gap-3">
        <Ring value={pct} label="asistencia" />
        <div className="grid w-full grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-elevated/50 p-2">
            <p className="font-mono text-lg font-bold text-fg">{m.done}</p>
            <p className="text-[10px] uppercase text-muted">hechos</p>
          </div>
          <div className="rounded-lg bg-elevated/50 p-2">
            <p className="font-mono text-lg font-bold text-fg">{m.missed}</p>
            <p className="text-[10px] uppercase text-muted">perdidos</p>
          </div>
          <div className="rounded-lg bg-elevated/50 p-2">
            <p className="font-mono text-lg font-bold text-fg">{m.remaining}</p>
            <p className="text-[10px] uppercase text-muted">quedan</p>
          </div>
        </div>
      </div>
    </Card>
  )
}

function SleepCard({ now, last7 }: { now: Date; last7: Date[] }) {
  const sleep = useUserStore((s) => s.sleep)
  const logSleep = useUserStore((s) => s.logSleep)
  const todayKey = keyOf(now)
  const today = sleep.find((s) => s.date === todayKey)
  const [hours, setHours] = useState(today?.hours ?? 7.5)
  const [quality, setQuality] = useState(today?.quality ?? 7)

  const data = last7.map((d) => ({
    label: format(d, 'EEEEE', { locale: es }),
    value: sleep.find((s) => s.date === keyOf(d))?.hours ?? 0,
  }))
  const logged = data.filter((d) => d.value > 0)
  const avg = logged.length ? logged.reduce((s, d) => s + d.value, 0) / logged.length : null

  return (
    <Card
      title="Sueño"
      subtitle="Últimos 7 días (horas)"
      icon="😴"
      action={
        <div className="text-right">
          <p className="font-mono text-lg font-bold text-fg">{avg != null ? `${avg.toFixed(1)}h` : '—'}</p>
          <p className="text-[10px] uppercase text-muted">promedio</p>
        </div>
      }
    >
      <BarChart data={data} max={10} unit="h" />
      <form
        className="mt-4 flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          logSleep(todayKey, hours, quality)
        }}
      >
        <label className="text-xs text-muted">
          Horas
          <input
            type="number"
            step="0.5"
            min={0}
            max={14}
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="mt-1 block w-20 rounded-lg border border-surface-border/60 bg-input/60 px-2 py-1.5 text-sm text-fg focus:border-accent focus:outline-none"
          />
        </label>
        <label className="flex-1 text-xs text-muted">
          Calidad: <span className="text-fg">{quality}/10</span>
          <input
            type="range"
            min={1}
            max={10}
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
            className="mt-2 block w-full accent-violet-400"
          />
        </label>
        <button className="rounded-lg bg-violet-500/15 px-3 py-1.5 text-sm font-medium text-violet-700 hover:bg-violet-500/25 dark:text-violet-300">
          {today ? 'Actualizar' : 'Guardar hoy'}
        </button>
      </form>
    </Card>
  )
}

function EnergyCard({ now, last7 }: { now: Date; last7: Date[] }) {
  const energy = useUserStore((s) => s.energy)
  const logEnergy = useUserStore((s) => s.logEnergy)
  const todayKey = keyOf(now)
  const todayEnergy = energy.find((e) => e.date === todayKey)?.level ?? 0

  const data = last7.map((d) => ({
    label: format(d, 'EEEEE', { locale: es }),
    value: energy.find((e) => e.date === keyOf(d))?.level ?? 0,
  }))
  const logged = data.filter((d) => d.value > 0)
  const avg = logged.length ? logged.reduce((s, d) => s + d.value, 0) / logged.length : null

  return (
    <Card
      title="Energía"
      subtitle="Últimos 7 días (1–10)"
      icon="⚡"
      action={
        <div className="text-right">
          <p className="font-mono text-lg font-bold text-fg">{avg != null ? `${avg.toFixed(1)}/10` : '—'}</p>
          <p className="text-[10px] uppercase text-muted">promedio</p>
        </div>
      }
    >
      <LineChart data={data} />
      <p className="mb-2 mt-4 text-xs text-muted">¿Cómo te sientes hoy?</p>
      <div className="grid grid-cols-10 gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => logEnergy(todayKey, n)}
            className={clsx(
              'h-8 rounded-md text-xs font-medium transition-colors',
              todayEnergy === n ? 'bg-accent/25 text-accent ring-1 ring-accent' : 'bg-elevated text-muted hover:bg-control',
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </Card>
  )
}

/** Hábitos de bienestar de hoy (los del checklist marcados con 💚). */
function HabitsCard({ now }: { now: Date }) {
  const items = useChecklistStore((s) => s.items)
  const completions = useChecklistStore((s) => s.completions)
  const toggle = useChecklistStore((s) => s.toggleCompletion)
  const todayKey = keyOf(now)
  const habits = applicableItems(items, todayKey).filter((i) => i.wellness)
  const done = new Set(completions[todayKey] ?? [])
  const count = habits.filter((h) => done.has(h.id)).length

  return (
    <Card
      title="Hábitos"
      subtitle={habits.length ? `${count}/${habits.length} hoy` : 'Sin hábitos de bienestar'}
      icon="🌱"
      action={
        <Link to="/objetivos" className="text-xs text-accent hover:underline" title="Edítalos con ✏️ Hábitos en Metas de hoy">
          Editar →
        </Link>
      }
    >
      {habits.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-2">
          Marca hábitos con 💚 desde ✏️ Hábitos en Objetivos para verlos aquí.
        </p>
      ) : (
        <ul className="space-y-2">
          {habits.map((h) => {
            const isDone = done.has(h.id)
            return (
              <li key={h.id}>
                <button
                  onClick={() => toggle(todayKey, h.id)}
                  className={clsx(
                    'flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors',
                    isDone ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-surface-border/50 bg-elevated/40 hover:bg-elevated',
                  )}
                >
                  <span
                    className={clsx(
                      'grid h-5 w-5 shrink-0 place-items-center rounded-md border text-[11px]',
                      isDone ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-surface-border bg-input/60',
                    )}
                  >
                    {isDone && '✓'}
                  </span>
                  <span className="text-base">{h.icon}</span>
                  <span className={clsx('flex-1 text-sm', isDone ? 'text-muted line-through' : 'text-fg')}>{h.label}</span>
                  <span className="font-mono text-[10px] text-muted-2">+{DAILY_ITEM_XP}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

export default function Health() {
  const gym = useUserStore((s) => s.gym)
  const now = useMemo(() => new Date(), [])
  const last7 = useMemo(() => Array.from({ length: 7 }, (_, i) => subDays(now, 6 - i)), [now])

  // Racha de futsal: entrenamientos seguidos sin fallar, hacia atrás (hoy no corta si aún no se marca).
  const streak = useMemo(() => {
    const done = (d: Date) => gym.some((g) => g.date === keyOf(d) && g.done)
    let count = 0
    let cursor = now
    for (let i = 0; i < 120; i++) {
      if (TRAINING_DAYS.has(dayCodeOf(cursor))) {
        if (done(cursor)) count++
        else if (keyOf(cursor) !== keyOf(now)) break
      }
      cursor = subDays(cursor, 1)
    }
    return count
  }, [gym, now])

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-fg sm:text-3xl">Bienestar</h1>
          <p className="text-sm text-muted">Futsal, sueño, energía y hábitos saludables.</p>
        </div>
        <div className="rounded-xl bg-amber-500/10 px-4 py-2 text-right">
          <p className="font-mono text-xl font-bold text-amber-700 dark:text-amber-300">🔥 {streak}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted">racha de entrenos</p>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <FutsalCard now={now} />
        <MonthRing now={now} />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SleepCard now={now} last7={last7} />
        <EnergyCard now={now} last7={last7} />
        <HabitsCard now={now} />
      </section>
    </div>
  )
}
