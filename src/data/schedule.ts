import type { BlockCategory, DayCode } from '@/types'
import { plan } from './plan'

export interface TimeBlock {
  id: string
  label: string
  icon: string
  start: string // "HH:MM"
  end: string // "HH:MM"
  /** Días en los que aplica. Sin definir = todos los días. */
  days?: DayCode[]
  /** Legado: solo días laborables (Lun–Vie). Se ignora si hay `days`. */
  weekdaysOnly?: boolean
  /** Ruta a la que enlaza el bloque, si aplica. */
  to?: string
}

export const WEEK_DAYS: { code: DayCode; short: string }[] = [
  { code: 'MO', short: 'L' },
  { code: 'TU', short: 'M' },
  { code: 'WE', short: 'X' },
  { code: 'TH', short: 'J' },
  { code: 'FR', short: 'V' },
  { code: 'SA', short: 'S' },
  { code: 'SU', short: 'D' },
]

const WEEKDAYS: DayCode[] = ['MO', 'TU', 'WE', 'TH', 'FR']

const CATEGORY_META: Record<BlockCategory, { icon: string; to?: string }> = {
  negocio: { icon: '💼', to: '/plan' },
  estudio: { icon: '📚', to: '/study' },
  salud: { icon: '⚽', to: '/health' },
  trading: { icon: '📈', to: '/plan' },
  lectura: { icon: '📖', to: '/plan' },
  revision: { icon: '🧭', to: '/review' },
}

/** Días efectivos de un bloque (resuelve el legado `weekdaysOnly`). */
export function blockDays(b: TimeBlock): DayCode[] {
  if (b.days && b.days.length) return b.days
  if (b.weekdaysOnly) return WEEKDAYS
  return WEEK_DAYS.map((d) => d.code)
}

/**
 * Bloques semanales del Plan Millonario. Los bloques con el mismo título y
 * horario se agrupan (p. ej. futsal martes y sábado).
 */
function fromPlan(): TimeBlock[] {
  const byKey = new Map<string, TimeBlock>()
  for (const wb of plan.weeklyBlocks) {
    const key = `${wb.title}|${wb.start}|${wb.end}`
    const existing = byKey.get(key)
    if (existing) {
      existing.days = [...(existing.days ?? []), wb.day]
      continue
    }
    const meta = CATEGORY_META[wb.category]
    byKey.set(key, {
      id: `wb_${wb.day}_${wb.start.replace(':', '')}`,
      label: wb.title,
      icon: meta.icon,
      start: wb.start,
      end: wb.end,
      days: [wb.day],
      to: meta.to,
    })
  }
  return [...byKey.values()]
}

/** Horario semanal por defecto (Plan Millonario). Editable desde el Dashboard. */
export const daySchedule: TimeBlock[] = fromPlan()

/** "HH:MM" → minutos desde medianoche. */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}
