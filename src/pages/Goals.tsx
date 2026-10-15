import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { clsx } from 'clsx'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Card, ProgressBar } from '@/components/common'
import DailyGoals from '@/components/DailyGoals'
import { GRADE_LABEL, money, useMonthlyGoals } from '@/components/MonthlyGoals'
import { applicableItems, useChecklistStore, useCourseStore, useGoalsStore, useUserStore } from '@/store'
import { plan, TRAINING_DAYS } from '@/data/plan'
import { dayCodeOf, dayCompletion, gradeStatus } from '@/utils'

import { Stat, inputCls, num } from '@/components/goalsUi'

function ReadingCard() {
  const g = useMonthlyGoals()
  const pagesPerDay = useGoalsStore((s) => s.pagesPerDay)
  const readingLog = useGoalsStore((s) => s.readingLog)
  const setPagesPerDay = useGoalsStore((s) => s.setPagesPerDay)
  const logPages = useGoalsStore((s) => s.logPages)
  const { reading } = g
  const metToday = reading.pace === 0 || reading.today >= reading.pace

  return (
    <Card title="Lectura" subtitle="La meta de hoy se recalcula con lo que falta del mes" icon="📖">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Toca hoy" value={`${reading.pace} pág`} hint={metToday ? '✅ cumplido' : `llevas ${reading.today}`} />
        <Stat label="Este mes" value={`${reading.read}/${reading.target}`} hint="páginas" />
        <Stat label="Meta base" value={`${pagesPerDay}/día`} hint="× días del mes" />
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="text-xs text-muted">
          Páginas leídas hoy
          <input
            type="number"
            min={0}
            value={reading.today || ''}
            placeholder="0"
            onChange={(e) => logPages(g.todayKey, num(e.target.value) ?? 0)}
            className={clsx(inputCls, 'mt-1 block w-24')}
          />
        </label>
        <label className="text-xs text-muted">
          Meta por día
          <input
            type="number"
            min={0}
            value={pagesPerDay}
            onChange={(e) => setPagesPerDay(num(e.target.value) ?? 0)}
            className={clsx(inputCls, 'mt-1 block w-20')}
          />
        </label>
      </div>

      {/* Mapa del mes: verde si ese día llegaste a la meta base. */}
      <div className="mt-4 grid grid-cols-7 gap-1 sm:grid-cols-[repeat(16,minmax(0,1fr))]">
        {Array.from({ length: g.daysInMonth }, (_, i) => {
          const key = `${g.month}-${String(i + 1).padStart(2, '0')}`
          const n = readingLog[key] ?? 0
          const future = key > g.todayKey
          return (
            <div
              key={key}
              title={`${i + 1}: ${n} pág`}
              className={clsx(
                'flex h-7 items-center justify-center rounded text-[10px]',
                future && 'bg-elevated/30 text-muted-2',
                !future && n >= pagesPerDay && 'bg-violet-500/30 text-fg',
                !future && n > 0 && n < pagesPerDay && 'bg-violet-500/10 text-fg-soft',
                !future && n === 0 && 'bg-elevated/60 text-muted',
                key === g.todayKey && 'ring-1 ring-accent',
              )}
            >
              {i + 1}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function TrainingCard() {
  const { training } = useMonthlyGoals()
  return (
    <Card
      title="Entrenamientos"
      subtitle="Cumplir los días programados del mes"
      icon="⚽"
      action={
        <Link to="/bienestar" className="text-xs text-accent hover:underline">
          Marcar en Bienestar →
        </Link>
      }
    >
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Hechos" value={`${training.done}/${training.planned}`} />
        <Stat label="Perdidos" value={training.missed} hint={training.missed ? 'no se recuperan' : 'ninguno 💪'} />
        <Stat label="Quedan" value={training.remaining} hint="días programados" />
      </div>
      <ProgressBar
        className="mt-4"
        value={training.planned ? (training.done / training.planned) * 100 : 0}
        label="Asistencia del mes"
        showValue
        gradient="green"
      />
    </Card>
  )
}

function CourseGrades({ courseId }: { courseId: string }) {
  const evaluations = useGoalsStore((s) => s.evaluations[courseId]) ?? []
  const addEvaluation = useGoalsStore((s) => s.addEvaluation)
  const updateEvaluation = useGoalsStore((s) => s.updateEvaluation)
  const removeEvaluation = useGoalsStore((s) => s.removeEvaluation)
  const totalWeight = evaluations.reduce((s, e) => s + e.weight, 0)

  return (
    <div className="mt-3 space-y-2">
      {evaluations.map((e) => (
        <div key={e.id} className="flex items-center gap-2">
          <input value={e.name} onChange={(ev) => updateEvaluation(courseId, e.id, { name: ev.target.value })} className={clsx(inputCls, 'min-w-0 flex-1')} />
          <label className="flex items-center gap-1 text-xs text-muted">
            <input type="number" min={0} max={100} value={e.weight} onChange={(ev) => updateEvaluation(courseId, e.id, { weight: num(ev.target.value) ?? 0 })} className={clsx(inputCls, 'w-16')} />%
          </label>
          <input
            type="number"
            min={0}
            max={20}
            step="0.1"
            placeholder="nota"
            value={e.grade ?? ''}
            onChange={(ev) => updateEvaluation(courseId, e.id, { grade: num(ev.target.value) })}
            className={clsx(inputCls, 'w-20')}
          />
          <button onClick={() => removeEvaluation(courseId, e.id)} className="text-xs text-muted hover:text-rose-500" aria-label="Eliminar">
            ✕
          </button>
        </div>
      ))}
      <div className="flex items-center justify-between">
        <button
          onClick={() => addEvaluation(courseId, { name: `Evaluación ${evaluations.length + 1}`, weight: Math.max(0, 100 - totalWeight), grade: null })}
          className="rounded-lg bg-elevated px-3 py-1 text-xs text-fg-soft hover:bg-control"
        >
          + Evaluación
        </button>
        {evaluations.length > 0 && (
          <span className={clsx('text-[11px]', totalWeight === 100 ? 'text-muted-2' : 'text-amber-600 dark:text-amber-400')}>
            Pesos: {totalWeight}%{totalWeight !== 100 && ' (deberían sumar 100)'}
          </span>
        )}
      </div>
    </div>
  )
}

function StudyCard() {
  const courses = useCourseStore((s) => s.courses)
  const evaluations = useGoalsStore((s) => s.evaluations)
  const passingGrade = useGoalsStore((s) => s.passingGrade)
  const setPassingGrade = useGoalsStore((s) => s.setPassingGrade)
  const [open, setOpen] = useState<string | null>(null)

  return (
    <Card
      title="Aprobar todos los cursos"
      subtitle="Nota mínima que necesitas en lo que te falta rendir"
      icon="📚"
      action={
        <label className="flex items-center gap-2 text-xs text-muted">
          Aprueba con
          <input type="number" min={0} max={20} step="0.5" value={passingGrade} onChange={(e) => setPassingGrade(num(e.target.value) ?? 0)} className={clsx(inputCls, 'w-16')} />
        </label>
      }
    >
      <div className="space-y-2">
        {courses.map((c) => {
          const s = gradeStatus(evaluations[c.id] ?? [], passingGrade)
          const label = GRADE_LABEL[s.state]
          const isOpen = open === c.id
          return (
            <div key={c.id} className="rounded-lg border border-surface-border/40 bg-elevated/30 p-3">
              <button onClick={() => setOpen(isOpen ? null : c.id)} className="flex w-full items-center gap-3 text-left">
                <span>{c.icon}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-fg">{c.name}</span>
                <span className="hidden text-xs text-muted sm:inline">
                  {s.average != null && `prom. ${s.average.toFixed(1)}`}
                  {s.needed != null && s.coveredWeight > 0 && s.needed > 0 && ` · necesitas ${s.needed.toFixed(1)}`}
                </span>
                <span className={clsx('badge', label.className)}>{label.text}</span>
                <span className="text-xs text-muted">{isOpen ? '▴' : '▾'}</span>
              </button>
              {s.needed != null && s.coveredWeight > 0 && s.needed > 0 && (
                <p className="mt-1 text-xs text-muted sm:hidden">Necesitas {s.needed.toFixed(1)} en el {s.remainingWeight}% que falta</p>
              )}
              {isOpen && <CourseGrades courseId={c.id} />}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

const pct = (a: number, b: number) => (b > 0 ? Math.min(100, (a / b) * 100) : 0)

/** Tarjeta de una meta del mes: valor actual, meta y barra. */
function MetricCard({ icon, tile, title, value, sub, value100, gradient, to }: {
  icon: string
  tile: string
  title: string
  value: React.ReactNode
  sub: React.ReactNode
  value100: number
  gradient: 'accent' | 'green' | 'amber' | 'violet'
  /** Ruta de la app o ancla (#id) dentro de esta página. */
  to: string
}) {
  const body = (
    <Card className="flex h-full flex-col transition-colors hover:border-accent/40">
      <div className="flex items-start gap-3">
        <span className={clsx('grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl', tile)}>{icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-fg">{title}</p>
          <p className="text-xs text-muted">{sub}</p>
        </div>
        <span className="font-mono text-sm font-semibold text-fg-soft">{Math.round(value100)}%</span>
      </div>
      <div className="mt-auto pt-4">
        <p className="font-mono text-2xl font-bold text-fg">{value}</p>
        <ProgressBar className="mt-2" value={value100} gradient={gradient} />
      </div>
    </Card>
  )
  if (to.startsWith('#')) {
    return (
      <button
        onClick={() => document.getElementById(to.slice(1))?.scrollIntoView({ behavior: 'smooth' })}
        className="block w-full text-left"
      >
        {body}
      </button>
    )
  }
  return (
    <Link to={to} className="block">
      {body}
    </Link>
  )
}

function MetricCards() {
  const g = useMonthlyGoals()
  const passingGrade = useGoalsStore((s) => s.passingGrade)
  const withGrades = g.grades.filter((x) => x.status.average != null)
  const avg = withGrades.length ? withGrades.reduce((s, x) => s + x.status.average!, 0) / withGrades.length : null
  const ok = g.grades.filter((x) => x.status.state === 'aprobado' || x.status.state === 'en-camino').length

  return (
    <div className="grid h-full grid-cols-1 gap-6 sm:grid-cols-2">
      <MetricCard
        icon="📚"
        tile="bg-cyan-500/15"
        title="Notas UTEC"
        to="#notas"
        sub={avg != null ? `Promedio ${avg.toFixed(1)} · aprueba con ${passingGrade}` : 'Registra tus notas abajo'}
        value={`${ok}/${g.grades.length} cursos`}
        value100={pct(ok, g.grades.length)}
        gradient="accent"
      />
      <MetricCard
        icon="⚽"
        tile="bg-emerald-500/15"
        title="Entrenamientos"
        to="#entrenamientos"
        sub={`Futsal · ${g.training.missed} perdidos · quedan ${g.training.remaining}`}
        value={`${g.training.done}/${g.training.planned}`}
        value100={pct(g.training.done, g.training.planned)}
        gradient="green"
      />
      <MetricCard
        icon="📖"
        tile="bg-violet-500/15"
        title="Páginas leídas"
        to="#lectura"
        sub={`Hoy te tocan ${g.reading.pace}`}
        value={`${g.reading.read}/${g.reading.target}`}
        value100={pct(g.reading.read, g.reading.target)}
        gradient="violet"
      />
      <MetricCard
        icon="💼"
        tile="bg-amber-500/15"
        title="Ingresos"
        to="/finanzas?tab=ingresos"
        sub={`Esperado a hoy: ${money(g.money.expected, g.money.currency)}`}
        value={`${money(g.money.earned, g.money.currency)} / ${money(g.money.target, g.money.currency)}`}
        value100={pct(g.money.earned, g.money.target)}
        gradient="amber"
      />
    </div>
  )
}

const dayLabel = (key: string) => format(parseISO(key), "d 'de' MMM", { locale: es })

/** Barras con el % cumplido de cada día del mes. */
function DailyHistory() {
  const g = useMonthlyGoals()
  const habits = useChecklistStore((s) => s.items)
  const completions = useChecklistStore((s) => s.completions)
  const studyDays = useGoalsStore((s) => s.studyDays)
  const readingLog = useGoalsStore((s) => s.readingLog)
  const pagesPerDay = useGoalsStore((s) => s.pagesPerDay)
  const gym = useUserStore((s) => s.gym)

  const days = useMemo(() => {
    const trained = new Set(gym.filter((x) => x.done).map((x) => x.date))
    return Array.from({ length: g.daysInMonth }, (_, i) => {
      const key = `${g.month}-${String(i + 1).padStart(2, '0')}`
      if (key > g.todayKey) return { key, pct: null }
      const todays = applicableItems(habits, key)
      const doneIds = new Set(completions[key] ?? [])
      const { done, total } = dayCompletion({
        habits: todays.length,
        habitsDone: todays.filter((h) => doneIds.has(h.id)).length,
        studied: !!studyDays[key],
        pages: readingLog[key] ?? 0,
        pagesPerDay,
        trainingDay: TRAINING_DAYS.has(dayCodeOf(parseISO(key))),
        trained: trained.has(key),
      })
      return { key, pct: total ? (done / total) * 100 : 0 }
    })
  }, [g.daysInMonth, g.month, g.todayKey, habits, completions, studyDays, readingLog, pagesPerDay, gym])

  const past = days.filter((d) => d.pct != null)
  const avg = past.length ? past.reduce((s, d) => s + d.pct!, 0) / past.length : 0

  return (
    <Card
      className="lg:col-span-2"
      title="Cumplimiento diario"
      subtitle="Hábitos, estudio, lectura y entrenos de cada día del mes"
      icon="📊"
      action={<span className="badge bg-accent/10 font-mono text-accent">prom. {Math.round(avg)}%</span>}
    >
      <div className="flex h-36 items-end gap-[3px]">
        {days.map((d) => (
          <div
            key={d.key}
            title={d.pct == null ? dayLabel(d.key) : `${dayLabel(d.key)}: ${Math.round(d.pct)}%`}
            className={clsx(
              'flex-1 rounded-t-sm transition-all duration-500',
              d.pct == null
                ? 'bg-elevated/50'
                : d.pct === 0
                  ? 'bg-control'
                  : d.pct >= 100
                  ? 'bg-emerald-500'
                  : d.key === g.todayKey
                    ? 'bg-accent'
                    : 'bg-accent/50',
            )}
            style={{ height: d.pct == null || d.pct === 0 ? '4%' : `${Math.max(6, d.pct)}%` }}
          />
        ))}
      </div>
      <div className="mt-1 flex gap-[3px] text-[10px] text-muted-2">
        {days.map((d, i) => (
          <span
            key={d.key}
            className={clsx('flex-1 text-center', d.key === g.todayKey && 'font-semibold text-accent')}
          >
            {(i + 1) % 5 === 1 || d.key === g.todayKey ? i + 1 : ''}
          </span>
        ))}
      </div>
    </Card>
  )
}

/** Una regla de oro del plan, distinta cada día. */
function RuleOfTheDay() {
  const now = new Date()
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86_400_000)
  const rule = plan.rules[dayOfYear % plan.rules.length]
  return (
    <Card title="Regla del día" subtitle="Reglas de oro del Plan" icon="📜">
      <blockquote className="border-l-2 border-accent/60 pl-3 text-base italic leading-relaxed text-fg">“{rule}”</blockquote>
      <Link to="/plan" className="mt-4 inline-block text-xs text-accent hover:underline">
        Ver todas →
      </Link>
    </Card>
  )
}

export default function Goals() {
  const monthTitle = format(new Date(), "MMMM 'de' yyyy", { locale: es })
  const { daysLeft } = useMonthlyGoals()

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-fg sm:text-3xl">Metas de {monthTitle}</h1>
          <p className="text-sm text-muted">Meta mensual, medida día a día: lo que falta se reparte entre los días que quedan.</p>
        </div>
        <span className="badge bg-control/60 text-fg-soft">
          Quedan {daysLeft} {daysLeft === 1 ? 'día' : 'días'}
        </span>
      </header>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MetricCards />
        </div>
        <DailyGoals />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DailyHistory />
        <RuleOfTheDay />
      </section>

      <h2 className="pt-2 text-xs font-semibold uppercase tracking-wider text-muted">Detalle</h2>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div id="lectura" className="scroll-mt-20">
          <ReadingCard />
        </div>
        <div id="entrenamientos" className="scroll-mt-20">
          <TrainingCard />
        </div>
      </div>
      <div id="notas" className="scroll-mt-20">
        <StudyCard />
      </div>
    </div>
  )
}
