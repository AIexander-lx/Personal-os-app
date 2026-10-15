import { useEffect, useMemo, useState } from 'react'
import { clsx } from 'clsx'
import {
  addDays,
  addMonths,
  differenceInMinutes,
  format,
  isToday,
  isTomorrow,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { Card } from '@/components/common'
import DaySchedule from '@/components/DaySchedule'
import WeekCalendar from '@/components/WeekCalendar'
import MonthCalendar from '@/components/MonthCalendar'
import { useCalendarStore, type CalendarView } from '@/store'
import { enrich, eventColor, type EnrichedEvent } from '@/lib/scheduleEvents'
import {
  requestAccessToken,
  disconnect,
  isConnected,
  listCalendars,
  listEvents,
  type GCalCalendar,
  type GCalEvent,
} from '@/lib/googleCalendar'
import { formatDuration } from '@/utils'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const AGENDA_WINDOW_DAYS = 14
const UPCOMING_LIMIT = 8
const REFRESH_MS = 5 * 60 * 1000
const CLOCK_MS = 30 * 1000

const VIEWS: { id: CalendarView; label: string }[] = [
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
  { id: 'agenda', label: 'Lista' },
]

function dayLabel(key: string): string {
  const d = parseISO(key)
  if (isToday(d)) return 'Hoy'
  if (isTomorrow(d)) return 'Mañana'
  return format(d, "EEEE d 'de' MMMM", { locale: es })
}

function shortDayLabel(iso: string): string {
  const d = parseISO(iso)
  if (isToday(d)) return 'Hoy'
  if (isTomorrow(d)) return 'Mañana'
  return format(d, 'EEE d MMM', { locale: es })
}

/** Punto de la línea de tiempo (vista Lista): color por curso, con énfasis según estado. */
function dotClass(e: EnrichedEvent): string {
  if (e.status === 'done') return 'bg-control'
  if (e.isEval) {
    return clsx('bg-amber-500', e.status === 'current' && 'ring-4 ring-amber-500/30')
  }
  const color = eventColor(e.summary)
  return clsx(color.dot, e.status === 'current' && clsx('ring-4', color.ring))
}

/** Rango de fechas que pide cada vista. */
function rangeFor(view: CalendarView, anchor: Date, now: Date): { from: Date; to: Date } {
  if (view === 'week') {
    const from = startOfWeek(anchor, { weekStartsOn: 1 })
    return { from, to: addDays(from, 7) }
  }
  if (view === 'month') {
    const from = startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 })
    return { from, to: addDays(from, 42) }
  }
  return { from: now, to: addDays(now, AGENDA_WINDOW_DAYS) }
}

function EventSkeleton() {
  return (
    <div className="animate-pulse space-y-3 py-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-3 w-12 rounded bg-elevated" />
          <div className="h-3 flex-1 rounded bg-elevated" />
        </div>
      ))}
    </div>
  )
}

/** Vista Lista: próximos días agrupados, en línea de tiempo. */
function AgendaList({ events }: { events: EnrichedEvent[] }) {
  const grouped = useMemo(() => {
    const groups = new Map<string, EnrichedEvent[]>()
    for (const e of events) {
      const key = format(parseISO(e.start), 'yyyy-MM-dd')
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(e)
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [events])

  if (grouped.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-2">
        Sin eventos en los próximos {AGENDA_WINDOW_DAYS} días en este calendario.
      </p>
    )
  }

  return (
    <div className="space-y-5">
      {grouped.map(([key, items]) => (
        <div key={key}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted first-letter:uppercase">
            {dayLabel(key)}
          </p>
          <ol className="relative space-y-3 border-l border-surface-border/60 pl-5">
            {items.map((e) => (
              <li key={e.id} className="relative">
                <span className={clsx('absolute -left-[27px] top-1.5 h-3 w-3 rounded-full transition-colors', dotClass(e))} />
                <a
                  href={e.htmlLink}
                  target="_blank"
                  rel="noreferrer"
                  className={clsx(
                    'group -mx-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-2 py-1 transition-colors hover:bg-elevated/60',
                    e.status === 'done' && 'opacity-55',
                  )}
                >
                  <span className="w-20 shrink-0 font-mono text-xs text-muted">
                    {e.allDay ? 'Todo el día' : format(parseISO(e.start), 'HH:mm')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={clsx(
                        'truncate text-sm',
                        e.status === 'current' && 'font-semibold',
                        e.status === 'done'
                          ? 'text-muted line-through'
                          : e.isEval
                            ? 'text-amber-700 dark:text-amber-300'
                            : eventColor(e.summary).text,
                      )}
                    >
                      {e.summary}
                    </p>
                    {e.location && <p className="truncate text-[11px] text-muted-2">{e.location}</p>}
                  </div>
                  {e.isEval && (
                    <span className="badge shrink-0 bg-amber-500/10 text-amber-700 dark:text-amber-300">📝 Evaluación</span>
                  )}
                  {e.status === 'current' && !e.allDay && <span className="badge shrink-0 bg-accent/20 text-accent">AHORA</span>}
                </a>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  )
}

/** Columna lateral: lo que viene en los próximos días, con las evaluaciones resaltadas. */
function UpcomingEvents({ events, summary }: { events: EnrichedEvent[] | null; summary?: string }) {
  const upcoming = (events ?? []).filter((e) => e.status !== 'done').slice(0, UPCOMING_LIMIT)
  const evalCount = (events ?? []).filter((e) => e.isEval && e.status !== 'done').length

  return (
    <Card
      title="Próximos eventos"
      subtitle={`${AGENDA_WINDOW_DAYS} días · ${evalCount} ${evalCount === 1 ? 'evaluación' : 'evaluaciones'}`}
      icon="⏰"
    >
      {summary && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-2">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          <p className="min-w-0 flex-1 text-xs text-fg-soft">{summary}</p>
        </div>
      )}
      {events === null ? (
        <EventSkeleton />
      ) : upcoming.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-2">Nada en los próximos días.</p>
      ) : (
        <ul className="space-y-2">
          {upcoming.map((e) => {
            const color = eventColor(e.summary)
            return (
              <li key={e.id}>
                <a
                  href={e.htmlLink}
                  target="_blank"
                  rel="noreferrer"
                  className={clsx(
                    'flex items-start gap-3 rounded-lg border p-2.5 transition-colors hover:bg-elevated',
                    e.isEval ? 'border-amber-500/40 bg-amber-500/10' : 'border-surface-border/40 bg-elevated/40',
                  )}
                >
                  <span className={clsx('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full', e.isEval ? 'bg-amber-500' : color.dot)} />
                  <div className="min-w-0 flex-1">
                    <p className={clsx('truncate text-sm font-medium', e.isEval ? 'text-amber-800 dark:text-amber-200' : 'text-fg')}>
                      {e.isEval && '📝 '}
                      {e.summary}
                    </p>
                    <p className="text-[11px] capitalize text-muted">
                      {shortDayLabel(e.start)}
                      {!e.allDay && ` · ${format(parseISO(e.start), 'HH:mm')}`}
                      {e.location && ` · ${e.location}`}
                    </p>
                  </div>
                </a>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

export default function Study() {
  const calendarId = useCalendarStore((s) => s.calendarId)
  const setCalendarId = useCalendarStore((s) => s.setCalendarId)
  const view = useCalendarStore((s) => s.view)
  const setView = useCalendarStore((s) => s.setView)

  const [connected, setConnected] = useState(isConnected())
  const [connecting, setConnecting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [calendars, setCalendars] = useState<GCalCalendar[]>([])
  const [events, setEvents] = useState<GCalEvent[] | null>(null)
  const [upcomingRaw, setUpcomingRaw] = useState<GCalEvent[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [now, setNow] = useState(() => new Date())
  const [anchorDate, setAnchorDate] = useState(() => new Date())

  const weekStart = useMemo(() => startOfWeek(anchorDate, { weekStartsOn: 1 }), [anchorDate])
  const monthGridStart = useMemo(() => startOfWeek(startOfMonth(anchorDate), { weekStartsOn: 1 }), [anchorDate])

  const load = async (silent: boolean) => {
    if (!CLIENT_ID) {
      setError('Falta configurar VITE_GOOGLE_CLIENT_ID (ver .env.example).')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const token = await requestAccessToken(CLIENT_ID, silent)
      setConnected(true)
      const current = new Date()
      const { from, to } = rangeFor(view, anchorDate, current)
      const [cals, items, upcoming] = await Promise.all([
        listCalendars(token),
        listEvents(token, calendarId, from, to),
        listEvents(token, calendarId, current, addDays(current, AGENDA_WINDOW_DAYS)),
      ])
      setCalendars(cals)
      setEvents(items)
      setUpcomingRaw(upcoming)
      setLastSync(new Date())
    } catch (err) {
      setConnected(isConnected())
      setError(err instanceof Error ? err.message : 'Error desconocido.')
    } finally {
      setLoading(false)
      setConnecting(false)
    }
  }

  // Al entrar, si ya hubo una conexión previa, refresca en silencio (sin popup).
  useEffect(() => {
    if (isConnected()) void load(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Vuelve a sincronizar al cambiar de calendario, vista o fecha, y cada pocos minutos.
  useEffect(() => {
    if (!connected) return
    void load(true)
    const id = window.setInterval(() => void load(true), REFRESH_MS)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, calendarId, view, anchorDate])

  // Reloj liviano para resaltar "ahora" sin volver a pedir datos.
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), CLOCK_MS)
    return () => window.clearInterval(id)
  }, [])

  const handleConnect = () => {
    setConnecting(true)
    void load(false)
  }

  const handleDisconnect = () => {
    disconnect()
    setConnected(false)
    setEvents(null)
    setUpcomingRaw(null)
    setCalendars([])
    setError(null)
  }

  // Reaplica el estado en vivo (hecho/ahora/próximo) cada vez que avanza el reloj, sin refetch.
  const enriched = useMemo(() => (events ?? []).map((e) => enrich(e, now)), [events, now])
  const upcoming = useMemo(() => (upcomingRaw ? upcomingRaw.map((e) => enrich(e, now)) : null), [upcomingRaw, now])

  const current = upcoming?.find((e) => e.status === 'current' && !e.allDay)
  const next = upcoming?.find((e) => e.status === 'upcoming')
  const summary = current
    ? `Ahora: ${current.summary} · termina ${format(parseISO(current.end), 'HH:mm')}`
    : next
      ? `Libre · sigue ${next.summary} en ${formatDuration(Math.max(0, differenceInMinutes(parseISO(next.start), now)))}`
      : undefined

  const step = (dir: 1 | -1) =>
    setAnchorDate((d) => (view === 'month' ? addMonths(d, dir) : addDays(d, 7 * dir)))

  const title = view === 'agenda' ? 'Próximos 14 días' : format(anchorDate, 'MMMM yyyy', { locale: es })
  const weekLabel = `${format(weekStart, 'd MMM', { locale: es })} – ${format(addDays(weekStart, 6), 'd MMM', { locale: es })}`

  const navBtn =
    'grid h-8 w-8 place-items-center rounded-lg border border-surface-border/60 text-sm text-fg-soft hover:border-accent/50 hover:text-accent'

  return (
    <div className="space-y-6">
      <header className="animate-fade-in flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-fg sm:text-3xl">Agenda</h1>
          <p className="text-sm text-muted">Google Calendar en vivo · clases, evaluaciones y fechas importantes</p>
        </div>
        {connected && (
          <div className="flex flex-wrap items-center gap-2">
            {calendars.length > 0 && (
              <select
                value={calendarId}
                onChange={(e) => setCalendarId(e.target.value)}
                className="rounded-lg border border-surface-border/60 bg-input/60 px-2 py-1.5 text-xs text-fg focus:border-accent focus:outline-none"
              >
                {calendars.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.primary ? `${c.summary} (principal)` : c.summary}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => void load(true)}
              disabled={loading}
              className="rounded-lg border border-surface-border/60 px-3 py-1.5 text-xs text-fg-soft transition-colors hover:border-accent/50 hover:text-accent disabled:opacity-50"
            >
              {loading ? 'Actualizando…' : '↻ Actualizar'}
            </button>
            <button
              onClick={handleDisconnect}
              className="rounded-lg border border-surface-border/60 px-3 py-1.5 text-xs text-muted hover:text-rose-700 dark:hover:text-rose-300"
            >
              Desconectar
            </button>
          </div>
        )}
      </header>

      {!CLIENT_ID ? (
        <Card icon="⚠️" title="Falta configuración">
          <p className="text-sm text-fg-soft">
            Define <code className="rounded bg-elevated px-1 py-0.5 font-mono text-xs">VITE_GOOGLE_CLIENT_ID</code> en
            un archivo <code className="rounded bg-elevated px-1 py-0.5 font-mono text-xs">.env</code> (hay una
            plantilla en <code className="rounded bg-elevated px-1 py-0.5 font-mono text-xs">.env.example</code>) y
            reinicia el servidor de desarrollo. El README explica cómo conseguirlo en Google Cloud Console.
          </p>
        </Card>
      ) : !connected ? (
        <Card padded={false} className="overflow-hidden">
          <div className="flex flex-col items-center gap-4 p-8 text-center sm:p-10">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent/15 text-3xl text-accent shadow-glow">
              📅
            </div>
            <div>
              <h2 className="text-lg font-semibold text-fg">Conecta tu Google Calendar</h2>
              <p className="mx-auto mt-1 max-w-sm text-sm text-fg-soft">
                Tus clases y fechas de evaluación, siempre al día — sin volver a transcribirlas a mano.
              </p>
            </div>
            <ul className="grid w-full max-w-md gap-2 text-left text-xs text-muted">
              <li className="flex items-center gap-2 rounded-lg bg-elevated/50 px-3 py-2">
                <span className="text-sm">🔒</span> Solo lectura — esta app nunca modifica tu calendario.
              </li>
              <li className="flex items-center gap-2 rounded-lg bg-elevated/50 px-3 py-2">
                <span className="text-sm">🔄</span> Si un profesor cambia una fecha, lo editas en Google Calendar y
                aquí se refleja solo.
              </li>
              <li className="flex items-center gap-2 rounded-lg bg-elevated/50 px-3 py-2">
                <span className="text-sm">📝</span> Las evaluaciones se detectan y resaltan automáticamente.
              </li>
            </ul>
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="rounded-lg bg-accent/15 px-5 py-2.5 font-semibold text-accent transition-colors hover:bg-accent/25 disabled:opacity-50"
            >
              {connecting ? 'Conectando…' : '🔗 Conectar con Google'}
            </button>
            {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
          <Card padded={false} className="xl:col-span-3">
            {/* Barra: mes, navegación y vista */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-border/50 p-4">
              <div className="flex items-center gap-2">
                {view !== 'agenda' && (
                  <button onClick={() => step(-1)} className={navBtn} aria-label="Anterior">
                    ‹
                  </button>
                )}
                <div>
                  <p className="text-lg font-bold capitalize text-fg">{title}</p>
                  {view === 'week' && <p className="text-[11px] capitalize text-muted">{weekLabel}</p>}
                </div>
                {view !== 'agenda' && (
                  <>
                    <button onClick={() => step(1)} className={navBtn} aria-label="Siguiente">
                      ›
                    </button>
                    <button
                      onClick={() => setAnchorDate(new Date())}
                      className="rounded-lg border border-surface-border/60 px-2.5 py-1.5 text-xs text-fg-soft hover:border-accent/50 hover:text-accent"
                    >
                      Hoy
                    </button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1 rounded-lg bg-elevated/60 p-1" role="tablist">
                {VIEWS.map((v) => (
                  <button
                    key={v.id}
                    role="tab"
                    aria-selected={view === v.id}
                    onClick={() => setView(v.id)}
                    className={clsx(
                      'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                      view === v.id ? 'bg-surface-raised text-accent shadow-sm' : 'text-muted hover:text-fg',
                    )}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3">
              {error && <p className="mb-3 text-sm text-rose-600 dark:text-rose-400">{error}</p>}
              {events === null ? (
                <EventSkeleton />
              ) : view === 'week' ? (
                <WeekCalendar events={enriched} weekStart={weekStart} now={now} />
              ) : view === 'month' ? (
                <MonthCalendar
                  events={enriched}
                  gridStart={monthGridStart}
                  month={anchorDate}
                  onPickDay={(d) => {
                    setAnchorDate(d)
                    setView('week')
                  }}
                />
              ) : (
                <div className="p-2">
                  <AgendaList events={enriched} />
                </div>
              )}
            </div>

            {/* Pie: estado de la sincronización */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-surface-border/50 px-4 py-3 text-xs text-muted">
              <span className="flex items-center gap-2">
                <span className={clsx('h-2 w-2 rounded-full', error ? 'bg-rose-500' : 'bg-emerald-500')} />
                Sincronizado con Google Calendar
                {lastSync && <span className="font-mono text-muted-2">· {format(lastSync, 'HH:mm')}</span>}
              </span>
              <a
                href="https://calendar.google.com/calendar/r"
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-surface-border/60 px-3 py-1.5 text-fg-soft hover:border-accent/50 hover:text-accent"
              >
                Ver calendario completo ↗
              </a>
            </div>
          </Card>

          <UpcomingEvents events={upcoming} summary={summary} />
        </div>
      )}

      {/* Rutina del día (bloques propios, editables) */}
      <DaySchedule />
    </div>
  )
}
