import { clsx } from 'clsx'
import type { PlanPhase } from '@/types'
import { usePlanStore } from '@/store'
import { AREA_LABEL } from '@/data/plan'
import { phaseTaskKey, PHASE_TASK_XP } from '@/utils'

type Area = 'business' | 'trading' | 'reading'

const AREA_ICON: Record<Area, string> = { business: '💼', trading: '📈', reading: '📖' }

/** Tareas de una fase como lista marcable. Cada tarea da XP. */
export function PhaseTasks({ phase, className }: { phase: PlanPhase; className?: string }) {
  const phaseTasks = usePlanStore((s) => s.phaseTasks)
  const toggle = usePlanStore((s) => s.togglePhaseTask)

  const groups: { area: Area; items: string[] }[] = [
    { area: 'business', items: phase.business },
    { area: 'trading', items: phase.trading },
    { area: 'reading', items: phase.reading ? [phase.reading] : [] },
  ]

  return (
    <div className={clsx('grid grid-cols-1 gap-3 md:grid-cols-3', className)}>
      {groups.map(({ area, items }) => (
        <div key={area} className="rounded-lg bg-elevated/40 p-3">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
            <span>{AREA_ICON[area]}</span>
            {AREA_LABEL[area]}
          </p>
          {items.length === 0 ? (
            <p className="text-xs text-muted-2">Sin lectura esta fase (exámenes).</p>
          ) : (
            <ul className="space-y-1">
              {items.map((t, i) => {
                const key = phaseTaskKey(phase.id, area, i)
                const done = !!phaseTasks[key]
                return (
                  <li key={key}>
                    <button
                      onClick={() => toggle(key)}
                      className="flex w-full items-start gap-2 rounded-md px-1.5 py-1 text-left text-sm transition-colors hover:bg-elevated/60"
                      title={done ? 'Desmarcar' : `Marcar · +${PHASE_TASK_XP} XP`}
                    >
                      <span
                        className={clsx(
                          'mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded text-[10px]',
                          done ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-elevated text-muted-2 ring-1 ring-surface-border/60',
                        )}
                      >
                        {done ? '✓' : ''}
                      </span>
                      <span className={clsx(done ? 'text-muted line-through' : 'text-fg')}>{t}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}

/** Cuántas tareas tiene una fase y cuántas están marcadas. */
export function usePhaseTaskCount(phase: PlanPhase) {
  const phaseTasks = usePlanStore((s) => s.phaseTasks)
  const keys = [
    ...phase.business.map((_, i) => phaseTaskKey(phase.id, 'business', i)),
    ...phase.trading.map((_, i) => phaseTaskKey(phase.id, 'trading', i)),
    ...(phase.reading ? [phaseTaskKey(phase.id, 'reading', 0)] : []),
  ]
  return { done: keys.filter((k) => phaseTasks[k]).length, total: keys.length }
}

export default PhaseTasks
