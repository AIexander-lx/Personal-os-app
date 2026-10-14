import { clsx } from 'clsx'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Card, ProgressBar } from '@/components/common'
import CurrentPhaseCard from '@/components/CurrentPhaseCard'
import { usePhaseTaskCount } from '@/components/PhaseTasks'
import { usePlanStore, useUserStore } from '@/store'
import { plan, goal90, longTermGoals, PLAN_END } from '@/data/plan'
import { checklistXP, getPhaseStatus } from '@/utils'
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

function Checklist90() {
  const checklist = usePlanStore((s) => s.checklist)
  const toggle = usePlanStore((s) => s.toggleChecklist)
  const items = goal90.checklist ?? []
  const done = items.filter((i) => checklist[i.id]).length
  const pct = items.length ? Math.round((done / items.length) * 100) : 0
  const xpTotal = items.reduce((s, i) => s + checklistXP(i.id), 0)
  const xpDone = items.filter((i) => checklist[i.id]).reduce((s, i) => s + checklistXP(i.id), 0)

  return (
    <Card
      icon={HORIZON_ICON['90d']}
      title={`Meta 90 días · ${goal90.title}`}
      subtitle={`Hasta el ${longDate(goal90.deadline)}`}
      action={
        <span className="badge bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">
          {xpDone}/{xpTotal} XP
        </span>
      }
    >
      <ProgressBar value={pct} showValue gradient={pct >= 100 ? 'green' : 'accent'} />
      <p className="mb-3 mt-1 text-xs text-muted">
        {done}/{items.length} completados
      </p>
      <div className="space-y-1">
        {items.map((item) => {
          const isDone = !!checklist[item.id]
          const key = item.id === 'g90-5'
          return (
            <button
              key={item.id}
              onClick={() => toggle(item.id)}
              aria-pressed={isDone}
              className={clsx(
                'flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-elevated/50',
                key && !isDone && 'bg-amber-500/5 ring-1 ring-amber-500/30',
              )}
            >
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
              <span className="badge shrink-0 bg-control/60 text-fg-soft">+{checklistXP(item.id)}</span>
            </button>
          )
        })}
      </div>
      <p className="mt-3 text-[11px] text-muted-2">
        Desmarcar devuelve el XP. El primer cliente desbloquea el logro “Primer Cliente” y completar todo, “Plan 90 Días”; si los desmarcas, esos logros se revierten.
      </p>
    </Card>
  )
}

function PhaseTile({ phase, state }: { phase: PlanPhase; state: 'past' | 'current' | 'future' }) {
  const { done, total } = usePhaseTaskCount(phase)
  const pct = total ? Math.round((done / total) * 100) : 0
  return (
    <div
      className={clsx(
        'rounded-xl border p-4 transition-colors',
        state === 'current' && 'border-accent/50 bg-accent/5 shadow-glow',
        state === 'past' && 'border-surface-border/40 bg-elevated/20',
        state === 'future' && 'border-surface-border/40 bg-elevated/40',
      )}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-fg">
          {phase.id}. {phase.name}
        </h4>
        {state === 'current' ? (
          <span className="badge bg-accent/20 text-accent">AHORA</span>
        ) : state === 'past' ? (
          <span className="badge bg-control/60 text-fg-soft">Pasada</span>
        ) : null}
      </div>
      <p className="mb-2 text-xs text-muted">
        {short(phase.start)} – {short(phase.end)}
      </p>
      <ul className="mb-3 space-y-0.5 text-xs text-fg-soft">
        {phase.business.slice(0, 3).map((b) => (
          <li key={b} className="truncate">
            💼 {b}
          </li>
        ))}
        {phase.reading && <li className="truncate">📖 {phase.reading}</li>}
      </ul>
      <ProgressBar value={pct} size="sm" gradient={pct >= 100 ? 'green' : 'accent'} />
      <p className="mt-1 text-[11px] text-muted-2">
        {done}/{total} tareas
      </p>
    </div>
  )
}

function PhaseTimeline() {
  const status = getPhaseStatus(plan.phases, new Date())
  const currentId = status.kind === 'active' ? status.phase.id : status.kind === 'after' ? Infinity : 0
  return (
    <Card icon="🗓️" title="Temario de 12 semanas" subtitle="6 fases de dos semanas">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {plan.phases.map((p) => (
          <PhaseTile
            key={p.id}
            phase={p}
            state={p.id === currentId ? 'current' : p.id < currentId ? 'past' : 'future'}
          />
        ))}
      </div>
    </Card>
  )
}

function LongTermGoals() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {longTermGoals.map((g) => (
        <Card
          key={g.id}
          icon={HORIZON_ICON[g.horizon]}
          title={`Meta ${HORIZON_LABEL[g.horizon]}`}
          subtitle={`Al ${longDate(g.deadline)}`}
        >
          <p className="mb-3 text-sm font-medium text-fg">{g.title}</p>
          {g.targets && g.targets.length > 0 && (
            <ul className="space-y-1.5">
              {g.targets.map((t) => (
                <li key={t.metric} className="flex items-start justify-between gap-3 rounded-lg bg-elevated/40 px-3 py-2 text-xs">
                  <span className="text-muted">{t.metric}</span>
                  <span className="text-right font-semibold text-fg">{t.target}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ))}
    </div>
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

export default function Plan() {
  const githubCommits = useUserStore((s) => s.githubCommits)
  const peersHelped = useUserStore((s) => s.peersHelped)
  const setGithubCommits = useUserStore((s) => s.setGithubCommits)
  const setPeersHelped = useUserStore((s) => s.setPeersHelped)

  return (
    <div className="space-y-6">
      <header className="animate-fade-in">
        <h1 className="text-2xl font-bold text-fg sm:text-3xl">{plan.plan}</h1>
        <p className="text-sm text-muted">
          Freelance como escuela → producto propio → escalar · 90 días hasta el {longDate(PLAN_END)}
        </p>
      </header>

      <CurrentPhaseCard />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Checklist90 />
        </div>
        <GoldenRules />
      </div>

      <PhaseTimeline />

      <LongTermGoals />

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
