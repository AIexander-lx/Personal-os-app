import { useMemo } from 'react'
import { clsx } from 'clsx'
import { addDays, differenceInCalendarDays, format, getDay, isToday, parseISO, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { eventColor, type EnrichedEvent } from '@/lib/scheduleEvents'

interface WeekCalendarProps {
  /** Eventos de la semana mostrada (ya filtrados por rango por quien fetchea). */
  events: EnrichedEvent[]
  /** Lunes 00:00 de la semana mostrada. */
  weekStart: Date
  now: Date
}

const HOUR_HEIGHT = 56 // px por hora
const DEFAULT_START = 7
const DEFAULT_END = 21

interface LaidOutEvent extends EnrichedEvent {
  col: number
  totalCols: number
}

/** Rango de horas a mostrar: cubre todos los eventos con margen, con un mínimo razonable. */
function hourBounds(events: EnrichedEvent[]): { start: number; end: number } {
  let minStart = DEFAULT_START
  let maxEnd = DEFAULT_END
  for (const e of events) {
    if (e.allDay) continue
    minStart = Math.min(minStart, parseISO(e.start).getHours())
    const endDate = parseISO(e.end)
    const endHour = endDate.getHours() + (endDate.getMinutes() > 0 ? 1 : 0)
    maxEnd = Math.max(maxEnd, endHour)
  }
  return { start: Math.max(0, minStart), end: Math.min(24, maxEnd) }
}

/** Asigna columnas a eventos solapados de un mismo día (empaquetado voraz izquierda→derecha). */
function layoutDay(dayEvents: EnrichedEvent[]): LaidOutEvent[] {
  const sorted = [...dayEvents].sort((a, b) => +parseISO(a.start) - +parseISO(b.start))
  const columns: EnrichedEvent[][] = []
  const colOf = new Map<string, number>()
  for (const e of sorted) {
    let placed = -1
    for (let i = 0; i < columns.length; i++) {
      const last = columns[i][columns[i].length - 1]
      if (+parseISO(last.end) <= +parseISO(e.start)) {
        placed = i
        break
      }
    }
    if (placed === -1) {
      columns.push([])
      placed = columns.length - 1
    }
    columns[placed].push(e)
    colOf.set(e.id, placed)
  }
  const totalCols = Math.max(1, columns.length)
  return sorted.map((e) => ({ ...e, col: colOf.get(e.id) ?? 0, totalCols }))
}

export function WeekCalendar({ events, weekStart, now }: WeekCalendarProps) {
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])
  const bounds = useMemo(() => hourBounds(events), [events])
  const totalHeight = (bounds.end - bounds.start) * HOUR_HEIGHT
  const hourMarks = useMemo(
    () => Array.from({ length: bounds.end - bounds.start + 1 }, (_, i) => bounds.start + i),
    [bounds],
  )

  const byDay = useMemo(() => {
    const timed: EnrichedEvent[][] = Array.from({ length: 7 }, () => [])
    const allDay: EnrichedEvent[][] = Array.from({ length: 7 }, () => [])
    for (const e of events) {
      const idx = differenceInCalendarDays(startOfDay(parseISO(e.start)), weekStart)
      if (idx < 0 || idx > 6) continue
      ;(e.allDay ? allDay : timed)[idx].push(e)
    }
    return { timed: timed.map(layoutDay), allDay }
  }, [events, weekStart])

  const hasAllDay = byDay.allDay.some((d) => d.length > 0)

  const nowOffset = (() => {
    const todayIdx = days.findIndex((d) => isToday(d))
    if (todayIdx === -1) return null
    const minutes = now.getHours() * 60 + now.getMinutes()
    const offset = (minutes / 60 - bounds.start) * HOUR_HEIGHT
    if (offset < 0 || offset > totalHeight) return null
    return offset
  })()

  return (
    <div className="w-full overflow-x-auto">
      {/* min-w solo entra en juego en pantallas muy angostas; en desktop/tablet
          el grid ocupa el 100% disponible (1fr por columna) y se ven los 7 días
          siempre, sin recortarse por un ancho fijo. */}
      <div className="min-w-[480px] w-full">
        {/* Cabecera: días de la semana */}
        <div className="grid" style={{ gridTemplateColumns: '48px repeat(7, 1fr)' }}>
          <div />
          {days.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1 pb-2">
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted">
                {format(d, 'EEE', { locale: es })}
              </span>
              <span
                className={clsx(
                  'grid h-7 w-7 place-items-center rounded-full text-sm font-semibold',
                  isToday(d) ? 'bg-accent text-white shadow-glow' : 'text-fg',
                )}
              >
                {format(d, 'd')}
              </span>
            </div>
          ))}
        </div>

        {/* Eventos de todo el día */}
        {hasAllDay && (
          <div
            className="grid border-y border-surface-border/40 py-1.5"
            style={{ gridTemplateColumns: '48px repeat(7, 1fr)' }}
          >
            <div className="flex items-center justify-end pr-2 text-[9px] text-muted-2">Todo el día</div>
            {byDay.allDay.map((dayEvents, i) => (
              <div key={i} className="space-y-1 border-l border-surface-border/30 px-1">
                {dayEvents.map((e) => {
                  const color = eventColor(e.summary)
                  return (
                    <a
                      key={e.id}
                      href={e.htmlLink}
                      target="_blank"
                      rel="noreferrer"
                      className={clsx(
                        'block truncate rounded px-1.5 py-0.5 text-[10px] font-medium',
                        e.isEval
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                          : clsx(color.bg, color.text),
                      )}
                    >
                      {e.summary}
                    </a>
                  )
                })}
              </div>
            ))}
          </div>
        )}

        {/* Grid de horas */}
        <div className="relative grid" style={{ gridTemplateColumns: '48px repeat(7, 1fr)', height: totalHeight }}>
          {/* Gutter de horas */}
          <div className="relative">
            {hourMarks.slice(0, -1).map((h) => (
              <div
                key={h}
                className="absolute right-2 -translate-y-1/2 font-mono text-[10px] text-muted-2"
                style={{ top: (h - bounds.start) * HOUR_HEIGHT }}
              >
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Columnas de días */}
          {days.map((d, i) => {
            const weekend = getDay(d) === 0 || getDay(d) === 6
            return (
              <div
                key={i}
                className={clsx('relative border-l border-surface-border/30', weekend && 'bg-elevated/30')}
              >
                {hourMarks.map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-t border-surface-border/20"
                    style={{ top: (h - bounds.start) * HOUR_HEIGHT }}
                  />
                ))}

                {isToday(d) && nowOffset !== null && (
                  <div className="absolute left-0 right-0 z-10" style={{ top: nowOffset }}>
                    <div className="relative">
                      <span className="absolute -left-[3px] -top-[3px] h-[7px] w-[7px] rounded-full bg-accent shadow-glow" />
                      <div className="h-px bg-accent" />
                    </div>
                  </div>
                )}

                {byDay.timed[i].map((e) => {
                  const start = parseISO(e.start)
                  const end = parseISO(e.end)
                  const top = ((start.getHours() * 60 + start.getMinutes()) / 60 - bounds.start) * HOUR_HEIGHT
                  const durationMin = Math.max(20, (+end - +start) / 60000)
                  const height = (durationMin / 60) * HOUR_HEIGHT
                  const widthPct = 100 / e.totalCols
                  const color = eventColor(e.summary)
                  return (
                    <a
                      key={e.id}
                      href={e.htmlLink}
                      target="_blank"
                      rel="noreferrer"
                      className={clsx(
                        'group absolute overflow-hidden rounded-md border-l-2 px-1.5 py-0.5 text-[11px] leading-tight shadow-sm transition-[opacity,filter] hover:z-20 hover:brightness-110',
                        e.isEval
                          ? 'border-amber-500 bg-amber-500/15 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200'
                          : clsx(color.border, color.bg, color.text),
                        e.status === 'done' && 'opacity-60',
                      )}
                      style={{
                        top,
                        height,
                        left: `calc(${e.col * widthPct}% + 1px)`,
                        width: `calc(${widthPct}% - 2px)`,
                      }}
                      title={e.summary}
                    >
                      <p className="truncate font-semibold">{e.summary}</p>
                      {height > 32 && (
                        <p className="truncate font-mono text-[9px] opacity-70">
                          {format(start, 'HH:mm')}–{format(end, 'HH:mm')}
                        </p>
                      )}
                    </a>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default WeekCalendar
