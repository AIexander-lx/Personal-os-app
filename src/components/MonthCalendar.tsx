import { useMemo } from 'react'
import { clsx } from 'clsx'
import { addDays, format, isSameMonth, isToday, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { eventColor, type EnrichedEvent } from '@/lib/scheduleEvents'

interface MonthCalendarProps {
  events: EnrichedEvent[]
  /** Lunes con el que empieza la grilla (puede ser del mes anterior). */
  gridStart: Date
  /** Mes que se está mostrando (los días de otros meses salen atenuados). */
  month: Date
  /** Al tocar un día: abre esa semana. */
  onPickDay: (day: Date) => void
}

const MAX_CHIPS = 3
const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

/** Grilla mensual de 6 semanas con los eventos de cada día como chips. */
export function MonthCalendar({ events, gridStart, month, onPickDay }: MonthCalendarProps) {
  const days = useMemo(() => Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)), [gridStart])

  const byDay = useMemo(() => {
    const map = new Map<string, EnrichedEvent[]>()
    for (const e of events) {
      const key = format(parseISO(e.start), 'yyyy-MM-dd')
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(e)
    }
    // Evaluaciones primero: son lo que más importa ver de un vistazo.
    for (const list of map.values()) list.sort((a, b) => Number(b.isEval) - Number(a.isEval))
    return map
  }, [events])

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[560px]">
        <div className="grid grid-cols-7 pb-2">
          {WEEKDAYS.map((d) => (
            <span key={d} className="text-center text-[10px] font-medium uppercase tracking-wide text-muted">
              {d}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 overflow-hidden rounded-lg border border-surface-border/40">
          {days.map((d, i) => {
            const key = format(d, 'yyyy-MM-dd')
            const list = byDay.get(key) ?? []
            const inMonth = isSameMonth(d, month)
            return (
              <button
                key={key}
                onClick={() => onPickDay(d)}
                className={clsx(
                  'flex min-h-[92px] flex-col gap-1 border-surface-border/30 p-1.5 text-left transition-colors hover:bg-elevated/60',
                  i % 7 !== 0 && 'border-l',
                  i >= 7 && 'border-t',
                  !inMonth && 'bg-elevated/20 opacity-50',
                )}
              >
                <span
                  className={clsx(
                    'grid h-6 w-6 place-items-center rounded-full text-xs font-semibold',
                    isToday(d) ? 'bg-accent text-white shadow-glow' : 'text-fg',
                  )}
                >
                  {format(d, 'd')}
                </span>
                {list.slice(0, MAX_CHIPS).map((e) => {
                  const color = eventColor(e.summary)
                  return (
                    <span
                      key={e.id}
                      title={`${e.allDay ? '' : format(parseISO(e.start), 'HH:mm') + ' · '}${e.summary}`}
                      className={clsx(
                        'truncate rounded px-1 py-0.5 text-[10px] font-medium leading-tight',
                        e.isEval ? 'bg-amber-500/20 text-amber-800 dark:text-amber-200' : clsx(color.bg, color.text),
                        e.status === 'done' && 'opacity-50',
                      )}
                    >
                      {e.isEval && '📝 '}
                      {e.summary}
                    </span>
                  )
                })}
                {list.length > MAX_CHIPS && (
                  <span className="text-[10px] text-muted">+{list.length - MAX_CHIPS} más</span>
                )}
              </button>
            )
          })}
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-muted-2">
        Toca un día para verlo en la semana · {format(month, 'MMMM yyyy', { locale: es })}
      </p>
    </div>
  )
}

export default MonthCalendar
