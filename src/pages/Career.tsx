import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { clsx } from 'clsx'
import { Card, ProgressBar } from '@/components/common'
import { useUserStore } from '@/store'

interface Phase {
  id: string
  name: string
  period: string
  color: string
  milestones: string[]
  skills: string[]
}

const PHASES: Phase[] = [
  {
    id: 'p1',
    name: 'Fase 1 · Fundamentos',
    period: 'Jul – Ago 2026',
    color: 'from-cyan-400 to-blue-500',
    milestones: ['Fundamentos AED + Sistemas', 'StreakStudy v0.5', 'GitHub portfolio activo'],
    skills: ['Data Structures', 'C / POSIX', 'Git & GitHub', 'React'],
  },
  {
    id: 'p2',
    name: 'Fase 2 · Consolidación',
    period: 'Sep – Dic 2026',
    color: 'from-emerald-400 to-teal-500',
    milestones: ['A en los 6 cursos', 'Beta de StreakStudy', 'AWS Cloud Practitioner'],
    skills: ['Backend', 'SQL', 'AWS', 'Testing'],
  },
  {
    id: 'p3',
    name: 'Fase 3 · Prácticas',
    period: 'Ene – Jun 2027',
    color: 'from-amber-400 to-orange-500',
    milestones: ['Prácticas preprofesionales', 'Backend / FullStack real', 'Networking profesional'],
    skills: ['Docker', 'CI/CD', 'REST / GraphQL', 'System Design'],
  },
  {
    id: 'p4',
    name: 'Fase 4 · Especialización',
    period: '2027 – 2028',
    color: 'from-violet-400 to-fuchsia-500',
    milestones: ['Especialización técnica', 'StreakStudy v1.0 + monetización', 'Rol mid-level'],
    skills: ['ML en producción', 'Arquitectura Cloud', 'Liderazgo técnico'],
  },
]

interface Cert {
  id: string
  name: string
  target: string
}

const CERTS: Cert[] = [
  { id: 'c1', name: 'AWS Cloud Practitioner', target: 'Fase 2' },
  { id: 'c2', name: 'AWS Solutions Architect Associate', target: 'Fase 3' },
  { id: 'c3', name: 'Meta / freeCodeCamp Frontend', target: 'Fase 1' },
]

interface CareerState {
  doneMilestones: Record<string, boolean>
  doneCerts: Record<string, boolean>
  toggleMilestone: (key: string) => void
  toggleCert: (id: string) => void
}

const useCareerStore = create<CareerState>()(
  persist(
    (set) => ({
      doneMilestones: {},
      doneCerts: {},
      toggleMilestone: (key) =>
        set((s) => ({ doneMilestones: { ...s.doneMilestones, [key]: !s.doneMilestones[key] } })),
      toggleCert: (id) =>
        set((s) => ({ doneCerts: { ...s.doneCerts, [id]: !s.doneCerts[id] } })),
    }),
    { name: 'career-store' },
  ),
)

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

export default function Career() {
  const doneMilestones = useCareerStore((s) => s.doneMilestones)
  const doneCerts = useCareerStore((s) => s.doneCerts)
  const toggleMilestone = useCareerStore((s) => s.toggleMilestone)
  const toggleCert = useCareerStore((s) => s.toggleCert)
  const githubCommits = useUserStore((s) => s.githubCommits)
  const peersHelped = useUserStore((s) => s.peersHelped)
  const setGithubCommits = useUserStore((s) => s.setGithubCommits)
  const setPeersHelped = useUserStore((s) => s.setPeersHelped)

  const totalMilestones = PHASES.reduce((s, p) => s + p.milestones.length, 0)
  const completedMilestones = Object.values(doneMilestones).filter(Boolean).length
  const overall = Math.round((completedMilestones / totalMilestones) * 100)

  return (
    <div className="space-y-6">
      <header className="animate-fade-in">
        <h1 className="text-2xl font-bold text-fg sm:text-3xl">Roadmap profesional</h1>
        <p className="text-sm text-muted">Plan a 2 años · 4 fases</p>
      </header>

      <Card icon="🧭" title="Progreso global de carrera">
        <ProgressBar value={overall} showValue gradient="accent" />
        <p className="mt-2 text-xs text-muted">
          {completedMilestones}/{totalMilestones} hitos completados
        </p>
      </Card>

      <div className="relative space-y-6 before:absolute before:left-4 before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-surface-border/50 lg:before:left-1/2">
        {PHASES.map((phase, idx) => {
          const phaseDone = phase.milestones.filter((_, mi) => doneMilestones[`${phase.id}-${mi + 1}`]).length
          const phasePct = Math.round((phaseDone / phase.milestones.length) * 100)
          return (
            <div
              key={phase.id}
              className={clsx(
                'relative lg:flex lg:items-center',
                idx % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse',
              )}
            >
              <span className="absolute left-4 top-6 z-10 h-3 w-3 -translate-x-1/2 rounded-full bg-accent shadow-glow lg:left-1/2" />
              <div className="pl-10 lg:w-1/2 lg:px-8">
                <Card padded className="animate-fade-in">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-fg">{phase.name}</h3>
                      <p className="text-xs text-muted">{phase.period}</p>
                    </div>
                    <span
                      className={clsx(
                        'badge bg-gradient-to-r text-slate-900',
                        phase.color,
                      )}
                    >
                      {phasePct}%
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {phase.milestones.map((m, mi) => {
                      const key = `${phase.id}-${mi + 1}`
                      const done = !!doneMilestones[key]
                      return (
                        <button
                          key={key}
                          onClick={() => toggleMilestone(key)}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-elevated/50"
                        >
                          <span
                            className={clsx(
                              'grid h-5 w-5 place-items-center rounded-md text-[11px]',
                              done ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-elevated text-muted-2',
                            )}
                          >
                            {done ? '✓' : ''}
                          </span>
                          <span className={clsx(done ? 'text-muted line-through' : 'text-fg')}>
                            {m}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  <div className="mt-3 border-t border-surface-border/40 pt-3">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-2">
                      Skills
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {phase.skills.map((sk) => (
                        <span key={sk} className="badge bg-elevated text-fg-soft">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
              <div className="hidden lg:block lg:w-1/2" />
            </div>
          )
        })}
      </div>

      <Card title="Certificaciones" subtitle="Tracking de metas" icon="📜">
        <div className="space-y-2">
          {CERTS.map((c) => {
            const done = !!doneCerts[c.id]
            return (
              <label
                key={c.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg bg-elevated/40 p-3"
              >
                <input
                  type="checkbox"
                  checked={done}
                  onChange={() => toggleCert(c.id)}
                  className="h-4 w-4 accent-cyan-400"
                />
                <div className="flex-1">
                  <p className={clsx('text-sm', done ? 'text-muted line-through' : 'text-fg')}>
                    {c.name}
                  </p>
                  <p className="text-[11px] text-muted-2">Meta: {c.target}</p>
                </div>
                {done && <span className="badge bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">Obtenida</span>}
              </label>
            )
          })}
        </div>
      </Card>

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
