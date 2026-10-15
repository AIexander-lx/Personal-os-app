import { clsx } from 'clsx'
import { WEEK_DAYS } from '@/data/schedule'
import type { DayCode } from '@/types'

interface DayTogglesProps {
  value: DayCode[]
  onChange: (days: DayCode[]) => void
}

/** Selector compacto de días de la semana (L-D), usado en editores de horario/checklist. */
export function DayToggles({ value, onChange }: DayTogglesProps) {
  return (
    <div className="flex gap-0.5" role="group" aria-label="Días">
      {WEEK_DAYS.map((d) => {
        const on = value.includes(d.code)
        return (
          <button
            key={d.code}
            type="button"
            onClick={() => {
              const next = on ? value.filter((c) => c !== d.code) : [...value, d.code]
              // Al menos un día; mantiene el orden L→D.
              if (next.length) onChange(WEEK_DAYS.map((w) => w.code).filter((c) => next.includes(c)))
            }}
            className={clsx(
              'h-6 w-6 rounded text-[10px] font-semibold transition-colors',
              on ? 'bg-accent/20 text-accent' : 'bg-control/50 text-muted-2 hover:text-fg',
            )}
            aria-pressed={on}
          >
            {d.short}
          </button>
        )
      })}
    </div>
  )
}

export default DayToggles
