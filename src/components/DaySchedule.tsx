import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { clsx } from 'clsx'
import { format, isWeekend } from 'date-fns'
import { es } from 'date-fns/locale'
import { Card } from '@/components/common'
import { toMinutes, type TimeBlock } from '@/data/schedule'
import { useScheduleStore } from '@/store'
import { formatDuration } from '@/utils'

type BlockStatus = 'done' | 'current' | 'upcoming' | 'off'

interface EnrichedBlock extends TimeBlock {
  status: BlockStatus
  progress: number // 0-100 dentro del bloque (solo current)
}

const ROUTE_OPTIONS = [
  { value: '', label: 'Sin enlace' },
  { value: '/study', label: 'Study' },
  { value: '/health', label: 'Salud' },
  { value: '/streakstudy', label: 'StreakStudy' },
  { value: '/career', label: 'Carrera' },
  { value: '/roadmap', label: 'Roadmap' },
]

function ScheduleEditor() {
  const blocks = useScheduleStore((s) => s.blocks)
  const addBlock = useScheduleStore((s) => s.addBlock)
  const updateBlock = useScheduleStore((s) => s.updateBlock)
  const removeBlock = useScheduleStore((s) => s.removeBlock)
  const resetSchedule = useScheduleStore((s) => s.resetSchedule)

  const sorted = useMemo(
    () => [...blocks].sort((a, b) => toMinutes(a.start) - toMinutes(b.start)),
    [blocks],
  )

  return (
    <div className="space-y-2">
      {sorted.map((b) => (
        <div
          key={b.id}
          className="flex flex-wrap items-center gap-2 rounded-lg border border-surface-border/40 bg-elevated/40 p-2"
        >
          <input
            value={b.icon}
            onChange={(e) => updateBlock(b.id, { icon: e.target.value })}
            className="w-10 rounded-md border border-surface-border/60 bg-input/60 px-1 py-1 text-center text-sm focus:border-accent focus:outline-none"
            aria-label="Icono"
          />
          <input
            value={b.label}
            onChange={(e) => updateBlock(b.id, { label: e.target.value })}
            className="min-w-[8rem] flex-1 rounded-md border border-surface-border/60 bg-input/60 px-2 py-1 text-sm text-fg focus:border-accent focus:outline-none"
            aria-label="Nombre del bloque"
          />
          <input
            type="time"
            value={b.start}
            onChange={(e) => updateBlock(b.id, { start: e.target.value })}
            className="rounded-md border border-surface-border/60 bg-input/60 px-2 py-1 text-xs text-fg focus:border-accent focus:outline-none"
            aria-label="Inicio"
          />
          <span className="text-muted-2">–</span>
          <input
            type="time"
            value={b.end}
            onChange={(e) => updateBlock(b.id, { end: e.target.value })}
            className="rounded-md border border-surface-border/60 bg-input/60 px-2 py-1 text-xs text-fg focus:border-accent focus:outline-none"
            aria-label="Fin"
          />
          <select
            value={b.to ?? ''}
            onChange={(e) => updateBlock(b.id, { to: e.target.value || undefined })}
            className="rounded-md border border-surface-border/60 bg-input/60 px-1 py-1 text-xs text-fg focus:border-accent focus:outline-none"
            aria-label="Enlace"
          >
            {ROUTE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1 text-[11px] text-muted">
            <input
              type="checkbox"
              checked={!!b.weekdaysOnly}
              onChange={(e) => updateBlock(b.id, { weekdaysOnly: e.target.checked })}
              className="h-3.5 w-3.5 accent-cyan-400"
            />
            L-V
          </label>
          <button
            onClick={() => removeBlock(b.id)}
            className="ml-auto text-muted-2 hover:text-rose-600 dark:hover:text-rose-400"
            aria-label="Eliminar bloque"
          >
            ✕
          </button>
        </div>
      ))}

      <div className="flex gap-2 pt-1">
        <button
          onClick={() =>
            addBlock({ label: 'Nuevo bloque', icon: '⏳', start: '20:30', end: '21:00' })
          }
          className="flex-1 rounded-lg bg-accent/15 px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent/25"
        >
          + Agregar bloque
        </button>
        <button
          onClick={() => resetSchedule()}
          className="rounded-lg border border-surface-border/60 px-3 py-1.5 text-xs text-muted hover:text-rose-700 dark:hover:text-rose-300"
        >
          ↺ Restaurar
        </button>
      </div>
    </div>
  )
}

export function DaySchedule() {
  const scheduleBlocks = useScheduleStore((s) => s.blocks)
  const [now, setNow] = useState(() => new Date())
  const [editing, setEditing] = useState(false)

  // Refresco cada 30s para mover el resaltado del bloque actual.
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  const weekend = isWeekend(now)
  const nowMin = now.getHours() * 60 + now.getMinutes()

  const blocks = useMemo<EnrichedBlock[]>(() => {
    return [...scheduleBlocks]
      .sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
      .map((b) => {
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
  }, [scheduleBlocks, weekend, nowMin])

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
        <button
          onClick={() => setEditing((v) => !v)}
          className={clsx(
            'badge transition-colors',
            editing ? 'bg-accent/20 text-accent' : 'bg-control/60 text-fg-soft hover:text-accent',
          )}
        >
          {editing ? '✓ Listo' : '✏️ Editar'}
        </button>
      }
    >
      {editing ? (
        <ScheduleEditor />
      ) : (
        <>
          <p className="mb-4 text-sm text-fg-soft">{summary}</p>
          {blocks.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-2">
              Sin bloques. Pulsa <span className="text-accent">✏️ Editar</span> para agregar tu horario.
            </p>
          ) : (
            <ol className="space-y-1.5">
              {blocks.map((b) => {
                const isCurrent = b.status === 'current'
                const row = (
                  <div
                    className={clsx(
                      'flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors',
                      isCurrent && 'border-accent/50 bg-accent/10 shadow-glow',
                      b.status === 'done' && 'border-transparent bg-elevated/30 opacity-55',
                      b.status === 'upcoming' && 'border-surface-border/40 bg-elevated/40',
                      b.status === 'off' && 'border-transparent bg-elevated/20 opacity-40',
                    )}
                  >
                    <span className="w-24 shrink-0 font-mono text-xs text-muted">
                      {b.start}–{b.end}
                    </span>
                    <span className="text-lg">{b.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={clsx(
                          'truncate text-sm',
                          isCurrent ? 'font-semibold text-fg' : 'text-fg',
                          b.status === 'done' && 'text-muted line-through',
                        )}
                      >
                        {b.label}
                        {b.status === 'off' && (
                          <span className="ml-2 text-[11px] text-muted-2">(fin de semana)</span>
                        )}
                      </p>
                      {isCurrent && (
                        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-control">
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
                      <span className="shrink-0 text-emerald-700 dark:text-emerald-400/70">✓</span>
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
          )}
        </>
      )}
    </Card>
  )
}

export default DaySchedule
