import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { clsx } from 'clsx'
import { format, isWeekend } from 'date-fns'
import { es } from 'date-fns/locale'
import { Card } from '@/components/common'
import { daySchedule, toMinutes, type TimeBlock } from '@/data/schedule'
import { formatDuration } from '@/utils'

type BlockStatus = 'done' | 'current' | 'upcoming' | 'off'

interface EnrichedBlock extends TimeBlock {
  status: BlockStatus
  progress: number // 0-100 dentro del bloque (solo current)
}

export function DaySchedule() {
  const [now, setNow] = useState(() => new Date())

  // Refresco cada 30s para mover el resaltado del bloque actual.
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  const weekend = isWeekend(now)
  const nowMin = now.getHours() * 60 + now.getMinutes()

  const blocks = useMemo<EnrichedBlock[]>(() => {
    return daySchedule.map((b) => {
      const start = toMinutes(b.start)
      const end = toMinutes(b.end)
      const available = !b.weekdaysOnly || !weekend
      let status: BlockStatus = 'upcoming'
      let progress = 0
      if (!available) status = 'off'
      else if (nowMin >= end) status = 'done'
      else if (nowMin >= start && nowMin < end) {
        status = 'current'
        progress = Math.round(((nowMin - start) / (end - start)) * 100)
      }
      return { ...b, status, progress }
    })
  }, [weekend, nowMin])

  const current = blocks.find((b) => b.status === 'current')
  const next = blocks.find((b) => b.status === 'upcoming' && (!b.weekdaysOnly || !weekend))

  const summary = current
    ? `Ahora: ${current.label} · termina ${current.end}`
    : next
      ? `Libre · sigue ${next.label} en ${formatDuration(Math.max(0, toMinutes(next.start) - nowMin))}`
      : 'Día completado · a descansar 😴'

  return (
    <Card
      title="Hoy"
      subtitle={format(now, "EEEE d 'de' MMMM · HH:mm", { locale: es })}
      icon="🗓️"
      action={
        <span
          className={clsx(
            'badge',
            current ? 'bg-accent/15 text-accent' : 'bg-slate-700/60 text-slate-300',
          )}
        >
          {current ? '● en curso' : 'libre'}
        </span>
      }
    >
      <p className="mb-4 text-sm text-slate-300">{summary}</p>

      <ol className="space-y-1.5">
        {blocks.map((b) => {
          const isCurrent = b.status === 'current'
          const row = (
            <div
              className={clsx(
                'flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors',
                isCurrent && 'border-accent/50 bg-accent/10 shadow-glow',
                b.status === 'done' && 'border-transparent bg-slate-800/30 opacity-55',
                b.status === 'upcoming' && 'border-surface-border/40 bg-slate-800/40',
                b.status === 'off' && 'border-transparent bg-slate-800/20 opacity-40',
              )}
            >
              <span className="w-24 shrink-0 font-mono text-xs text-slate-400">
                {b.start}–{b.end}
              </span>
              <span className="text-lg">{b.icon}</span>
              <div className="min-w-0 flex-1">
                <p
                  className={clsx(
                    'truncate text-sm',
                    isCurrent ? 'font-semibold text-slate-100' : 'text-slate-200',
                    b.status === 'done' && 'text-slate-400 line-through',
                  )}
                >
                  {b.label}
                  {b.status === 'off' && (
                    <span className="ml-2 text-[11px] text-slate-500">(fin de semana)</span>
                  )}
                </p>
                {isCurrent && (
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-700">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-[width] duration-700"
                      style={{ width: `${b.progress}%` }}
                    />
                  </div>
                )}
              </div>
              {isCurrent ? (
                <span className="badge shrink-0 bg-accent/20 text-accent">AHORA</span>
              ) : b.status === 'done' ? (
                <span className="shrink-0 text-emerald-400/70">✓</span>
              ) : null}
            </div>
          )
          return (
            <li key={b.id}>
              {b.to && b.status !== 'off' ? (
                <Link to={b.to} className="block transition-transform hover:translate-x-0.5">
                  {row}
                </Link>
              ) : (
                row
              )}
            </li>
          )
        })}
      </ol>
    </Card>
  )
}

export default DaySchedule
