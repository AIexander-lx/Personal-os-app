import { useEffect, useState } from 'react'
import { clsx } from 'clsx'
import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import { Card, ProgressBar } from '@/components/common'
import AreaProgress from '@/components/AreaProgress'
import { PhaseTasks, usePhaseTaskCount } from '@/components/PhaseTasks'
import { usePlanStore, useUserStore, useJournalStore, JOURNAL_CHECKLIST_ID } from '@/store'
import { plan, goal90, longTermGoals, PLAN_START, PLAN_END } from '@/data/plan'
import { checklistXP, getPhaseStatus, demoClosedCount, JOURNAL_GOAL, type PhaseStatus } from '@/utils'
import type { Goal, PlanPhase } from '@/types'

const longDate = (d: string) => format(parseISO(d), "d 'de' MMMM yyyy", { locale: es })
const short = (d: string) => format(parseISO(d), 'd MMM', { locale: es })

const HORIZON_LABEL: Record<Goal['horizon'], string> = {
  '90d': '90 días',
  '1y': '1 año',
  '3y': '3 años',
  '10y': '10 años',
}

const HORIZON_ICON: Record<Goal['horizon'], string> = {
  '90d': '🎯',
  '1y': '📅',
  '3y': '🚀',
  '10y': '🏛️',
}

const HORIZON_TILE: Record<Goal['horizon'], string> = {
  '90d': 'bg-rose-500/15',
  '1y': 'bg-emerald-500/15',
  '3y': 'bg-cyan-500/15',
  '10y': 'bg-violet-500/15',
}

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

/** Estado del plan respecto a hoy; se recalcula cada 10 min por si la app queda abierta al cambiar de día. */
function usePhaseStatus(): PhaseStatus {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 10 * 60_000)
    return () => window.clearInterval(id)
  }, [])
  return getPhaseStatus(plan.phases, now)
}

/** Fase en foco: la actual, la primera si aún no empieza o la última si ya terminó. */
const focusPhase = (s: PhaseStatus) => (s.kind === 'active' ? s.phase : s.kind === 'before' ? s.next : s.last)

function MetaCounter({
  icon,
  label,
  value,
  goal,
  suffix,
  onChange,
}: {
  icon: string
  label: string
  value: number
  goal: number
  suffix: string
  onChange: (n: number) => void
}) {
  const pct = Math.min(100, Math.round((value / goal) * 100))
  const reached = value >= goal
  return (
    <div className="rounded-lg bg-elevated/40 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-sm text-fg">{label}</span>
        </div>
        {reached && <span className="badge bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">¡Meta!</span>}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(value - 1)}
          className="h-8 w-8 shrink-0 rounded-md bg-control/70 text-fg hover:bg-control"
          aria-label="Restar"
        >
          −
        </button>
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-20 rounded-lg border border-surface-border/60 bg-input/60 px-2 py-1.5 text-center text-sm text-fg focus:border-accent focus:outline-none"
        />
        <button
          onClick={() => onChange(value + 1)}
          className="h-8 w-8 shrink-0 rounded-md bg-control/70 text-fg hover:bg-control"
          aria-label="Sumar"
        >
          +
        </button>
        <span className="ml-1 text-xs text-muted">
          / {goal} {suffix}
        </span>
      </div>
      <ProgressBar className="mt-2" value={pct} size="sm" gradient={reached ? 'green' : 'accent'} />
    </div>
  )
}

/** Fase actual: en qué fase vas y cuánto le queda. */
function PhaseHero({ status }: { status: PhaseStatus }) {
  const phase = focusPhase(status)
  const count = usePhaseTaskCount(phase)

  let label = 'Fase actual'
  let detail: string
  let value: number
  if (status.kind === 'before') {
    label = 'Próxima fase'
    detail = `Empieza en ${status.daysUntil} ${status.daysUntil === 1 ? 'día' : 'días'} · ${short(phase.start)}`
    value = 0
  } else if (status.kind === 'active') {
    detail = `Día ${status.dayOfPhase} de ${status.phaseDays} · ${status.daysLeft === 0 ? 'último día' : `quedan ${status.daysLeft} días`}`
    value = (status.dayOfPhase / status.phaseDays) * 100
  } else {
    label = 'Plan terminado'
    detail = `Cerró el ${short(status.last.end)} · toca la revisión de 90 días`
    value = 100
  }

  return (
    <Card className="flex flex-col">
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <div className="mt-2 flex items-center gap-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-accent/15 font-mono text-2xl font-black text-accent">
          {phase.id}
        </span>
        <div className="min-w-0">
          <p className="text-lg font-bold text-fg">
            Fase {phase.id} · {phase.name}
          </p>
          <p className="text-xs text-muted">{detail}</p>
        </div>
      </div>
      <div className="mt-auto pt-4">
        <ProgressBar value={value} size="sm" gradient="accent" />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-muted">
            {count.done}/{count.total} tareas de la fase
          </span>
          <button onClick={() => scrollTo('fase')} className="badge bg-accent/15 text-accent hover:bg-accent/25">
            Ver fase →
          </button>
        </div>
      </div>
    </Card>
  )
}

/** Meta de los 90 días: días transcurridos y checklist. */
function GoalHero({ status }: { status: PhaseStatus }) {
  const checklist = usePlanStore((s) => s.checklist)
  const items = goal90.checklist ?? []
  const done = items.filter((i) => checklist[i.id]).length
  const totalDays = differenceInCalendarDays(parseISO(PLAN_END), parseISO(PLAN_START)) + 1
  const elapsed =
    status.kind === 'before' ? 0 : status.kind === 'after' ? totalDays : totalDays - status.planDaysLeft

  return (
    <Card className="flex flex-col">
      <p className="text-xs uppercase tracking-wider text-muted">Meta del plan · 90 días</p>
      <div className="mt-2 flex items-center gap-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-rose-500/15 text-3xl">🎯</span>
        <div className="min-w-0">
          <p className="text-lg font-bold text-fg">{goal90.title}</p>
          <p className="text-xs text-muted">Hasta el {longDate(goal90.deadline)}</p>
        </div>
      </div>
      <div className="mt-auto pt-4">
        <ProgressBar value={(elapsed / totalDays) * 100} size="sm" gradient="violet" />
        <div className="mt-3 flex items-center justify-between">
          <span className="font-mono text-xs text-muted">
            {elapsed}/{totalDays} días · {done}/{items.length} metas
          </span>
          <button onClick={() => scrollTo('checklist')} className="badge bg-accent/15 text-accent hover:bg-accent/25">
            Ver checklist →
          </button>
        </div>
      </div>
    </Card>
  )
}

function PhaseTile({
  phase,
  state,
  selected,
  onSelect,
}: {
  phase: PlanPhase
  state: 'past' | 'current' | 'future'
  selected: boolean
  onSelect: () => void
}) {
  const { done, total } = usePhaseTaskCount(phase)
  const complete = total > 0 && done === total
  return (
    <button
      onClick={onSelect}
      aria-pressed={selected}
      className={clsx(
        'flex flex-col rounded-xl border p-3 text-left transition-colors',
        selected ? 'border-accent/60 bg-accent/10' : 'border-surface-border/40 bg-elevated/40 hover:bg-elevated',
        state === 'current' && !selected && 'border-accent/40',
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={clsx(
            'grid h-7 w-7 place-items-center rounded-lg font-mono text-sm font-bold',
            complete
              ? 'bg-emerald-500 text-white'
              : state === 'current'
                ? 'bg-accent text-surface'
                : state === 'past'
                  ? 'bg-control text-fg-soft'
                  : 'bg-control/60 text-muted',
          )}
        >
          {complete ? '✓' : phase.id}
        </span>
        {state === 'current' && <span className="badge bg-accent/20 text-[10px] text-accent">AHORA</span>}
      </div>
      <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-tight text-fg">{phase.name}</p>
      <p className="text-[11px] text-muted-2">
        {short(phase.start)} – {short(phase.end)}
      </p>
      <ProgressBar className="mt-2" value={total ? (done / total) * 100 : 0} size="sm" gradient={complete ? 'green' : 'accent'} />
      <p className="mt-1 font-mono text-[11px] text-muted">
        {done}/{total}
      </p>
    </button>
  )
}

/** Las 6 fases; al tocar una se muestran sus tareas. */
function Phases({ status }: { status: PhaseStatus }) {
  const currentId = status.kind === 'active' ? status.phase.id : status.kind === 'after' ? Infinity : 0
  const [selectedId, setSelectedId] = useState(focusPhase(status).id)
  const selected = plan.phases.find((p) => p.id === selectedId) ?? plan.phases[0]

  return (
    <Card
      id="fase"
      className="scroll-mt-20"
      icon="🗓️"
      title={`Las ${plan.phases.length} fases`}
      subtitle="2 semanas cada una · toca una para ver sus tareas"
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {plan.phases.map((p) => (
          <PhaseTile
            key={p.id}
            phase={p}
            state={p.id === currentId ? 'current' : p.id < currentId ? 'past' : 'future'}
            selected={p.id === selected.id}
            onSelect={() => setSelectedId(p.id)}
          />
        ))}
      </div>
      <div className="mt-4 border-t border-surface-border/50 pt-4">
        <p className="mb-3 text-sm font-semibold text-fg">
          Fase {selected.id} · {selected.name}
          <span className="ml-2 text-xs font-normal text-muted">
            {short(selected.start)} – {short(selected.end)}
          </span>
        </p>
        <PhaseTasks phase={selected} />
      </div>
    </Card>
  )
}

function Checklist90() {
  const checklist = usePlanStore((s) => s.checklist)
  const toggle = usePlanStore((s) => s.toggleChecklist)
  const demoDone = useJournalStore((s) => demoClosedCount(s.trades))
  const items = goal90.checklist ?? []
  const done = items.filter((i) => checklist[i.id]).length
  const pct = items.length ? Math.round((done / items.length) * 100) : 0
  const xpTotal = items.reduce((s, i) => s + checklistXP(i.id), 0)
  const xpDone = items.filter((i) => checklist[i.id]).reduce((s, i) => s + checklistXP(i.id), 0)

  return (
    <Card
      id="checklist"
      className="scroll-mt-20"
      icon={HORIZON_ICON['90d']}
      title="Checklist de 90 días"
      subtitle={`${done}/${items.length} completados`}
      action={
        <span className="badge bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">
          {xpDone}/{xpTotal} XP
        </span>
      }
    >
      <ProgressBar value={pct} showValue gradient={pct >= 100 ? 'green' : 'accent'} />
      <div className="mt-3 space-y-1">
        {items.map((item) => {
          const isDone = !!checklist[item.id]
          const key = item.id === 'g90-5'
          const rowCls = clsx(
            'flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-elevated/50',
            key && !isDone && 'bg-amber-500/5 ring-1 ring-amber-500/30',
          )
          const inner = (
            <>
              <span
                className={clsx(
                  'grid h-5 w-5 shrink-0 place-items-center rounded-md text-[11px]',
                  isDone ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-elevated text-muted-2 ring-1 ring-surface-border',
                )}
              >
                {isDone ? '✓' : ''}
              </span>
              <span className={clsx('flex-1', isDone ? 'text-muted line-through' : 'text-fg', key && 'font-semibold')}>
                {key && '💰 '}
                {item.text}
              </span>
              {item.id === JOURNAL_CHECKLIST_ID && (
                <span className="badge shrink-0 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">
                  {Math.min(demoDone, JOURNAL_GOAL)}/{JOURNAL_GOAL}
                </span>
              )}
              <span className="badge shrink-0 bg-control/60 text-fg-soft">+{checklistXP(item.id)}</span>
            </>
          )
          // Este ítem se marca solo desde el diario de trading.
          return item.id === JOURNAL_CHECKLIST_ID ? (
            <Link key={item.id} to="/finanzas?tab=trading" className={rowCls} title="Se completa solo al registrar 30 operaciones en el diario">
              {inner}
            </Link>
          ) : (
            <button key={item.id} onClick={() => toggle(item.id)} aria-pressed={isDone} className={rowCls}>
              {inner}
            </button>
          )
        })}
      </div>
      <p className="mt-3 text-[11px] text-muted-2">
        Desmarcar devuelve el XP. Las 30 operaciones se marcan solas desde el diario. El primer cliente desbloquea el logro “Primer Cliente” y completar todo, “Plan 90 Días”; si los desmarcas, esos logros se revierten.
      </p>
    </Card>
  )
}

function GoldenRules() {
  return (
    <Card icon="📜" title="Reglas de oro" subtitle="No se negocian">
      <ol className="space-y-2">
        {plan.rules.map((r, i) => (
          <li key={r} className="flex gap-3 rounded-lg bg-elevated/40 p-3 text-sm text-fg">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent/15 text-xs font-bold text-accent">
              {i + 1}
            </span>
            <span>{r}</span>
          </li>
        ))}
      </ol>
    </Card>
  )
}

function LongTermGoals() {
  return (
    <Card className="lg:col-span-2" icon="🔭" title="Metas a largo plazo" subtitle="Hacia dónde apunta el plan">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {longTermGoals.map((g) => (
          <div key={g.id} className="flex flex-col rounded-xl border border-surface-border/40 bg-elevated/40 p-4">
            <div className="flex items-center gap-3">
              <span className={clsx('grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xl', HORIZON_TILE[g.horizon])}>
                {HORIZON_ICON[g.horizon]}
              </span>
              <div>
                <p className="text-sm font-bold text-fg">{HORIZON_LABEL[g.horizon]}</p>
                <p className="text-[11px] text-muted-2">{short(g.deadline)} {g.deadline.slice(0, 4)}</p>
              </div>
            </div>
            <p className="mt-3 text-sm font-medium text-fg">{g.title}</p>
            {g.targets && g.targets.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {g.targets.map((t) => (
                  <li key={t.metric} className="rounded-md bg-surface-raised/60 px-2 py-1.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-2">{t.metric}</p>
                    <p className="text-xs font-semibold text-fg">{t.target}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

export default function Plan() {
  const status = usePhaseStatus()
  const githubCommits = useUserStore((s) => s.githubCommits)
  const peersHelped = useUserStore((s) => s.peersHelped)
  const setGithubCommits = useUserStore((s) => s.setGithubCommits)
  const setPeersHelped = useUserStore((s) => s.setPeersHelped)

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-fg sm:text-3xl">{plan.plan}</h1>
          <p className="text-sm text-muted">Tu hoja de ruta hacia la libertad financiera.</p>
        </div>
        <span className="badge bg-control/60 text-fg-soft">
          {short(PLAN_START)} → {short(PLAN_END)} {PLAN_END.slice(0, 4)}
        </span>
      </header>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PhaseHero status={status} />
        <GoalHero status={status} />
      </section>

      <Phases status={status} />

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <LongTermGoals />
        <AreaProgress />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Checklist90 />
        </div>
        <GoldenRules />
      </section>

      <Card title="Portfolio & comunidad" subtitle="Alimenta logros: GitHub Hero y Community Builder" icon="🐙">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MetaCounter
            icon="🐙"
            label="Commits en GitHub"
            value={githubCommits}
            goal={50}
            suffix="commits"
            onChange={setGithubCommits}
          />
          <MetaCounter
            icon="🤝"
            label="Compañeros ayudados"
            value={peersHelped}
            goal={5}
            suffix="personas"
            onChange={setPeersHelped}
          />
        </div>
      </Card>
    </div>
  )
}
