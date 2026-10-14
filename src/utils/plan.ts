import { addWeeks, differenceInCalendarDays, format, parseISO, startOfWeek } from 'date-fns'
import type { DayCode, PlanPhase, WeeklyKpi } from '@/types'

const DAY_CODES: DayCode[] = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

/** Código de día (MO…SU) de una fecha local. */
export function dayCodeOf(date: Date): DayCode {
  return DAY_CODES[date.getDay()]
}

const keyOf = (date: Date) => format(date, 'yyyy-MM-dd')

/** Lunes (yyyy-MM-dd) de la semana de `date`. */
export function weekStartKey(date: Date): string {
  return keyOf(startOfWeek(date, { weekStartsOn: 1 }))
}

/** Fase que contiene la fecha (ambos extremos inclusive), o undefined. */
export function phaseForDate(phases: PlanPhase[], date: Date): PlanPhase | undefined {
  const k = keyOf(date)
  return phases.find((p) => k >= p.start && k <= p.end)
}

export type PhaseStatus =
  | { kind: 'before'; next: PlanPhase; daysUntil: number }
  | {
      kind: 'active'
      phase: PlanPhase
      /** Día dentro de la fase (1 = primer día). */
      dayOfPhase: number
      phaseDays: number
      /** Días que quedan después de hoy en la fase. */
      daysLeft: number
      /** Avance del plan completo (0-100). */
      planProgress: number
      planDaysLeft: number
    }
  | { kind: 'after'; last: PlanPhase; daysSince: number }

/** Dónde está `date` respecto al temario: antes, dentro de una fase o después. */
export function getPhaseStatus(phases: PlanPhase[], date: Date): PhaseStatus {
  const first = phases[0]
  const last = phases[phases.length - 1]
  const k = keyOf(date)
  if (k < first.start) {
    return { kind: 'before', next: first, daysUntil: differenceInCalendarDays(parseISO(first.start), date) }
  }
  if (k > last.end) {
    return { kind: 'after', last, daysSince: differenceInCalendarDays(date, parseISO(last.end)) }
  }
  // Si hubiera un hueco entre fases, se toma la siguiente.
  const phase = phaseForDate(phases, date) ?? phases.find((p) => p.start > k)!
  const start = parseISO(phase.start)
  const end = parseISO(phase.end)
  const planStart = parseISO(first.start)
  const planEnd = parseISO(last.end)
  const planTotal = differenceInCalendarDays(planEnd, planStart) + 1
  const planElapsed = differenceInCalendarDays(date, planStart) + 1
  return {
    kind: 'active',
    phase,
    dayOfPhase: Math.max(1, differenceInCalendarDays(date, start) + 1),
    phaseDays: differenceInCalendarDays(end, start) + 1,
    daysLeft: Math.max(0, differenceInCalendarDays(end, date)),
    planProgress: Math.min(100, Math.round((planElapsed / planTotal) * 100)),
    planDaysLeft: Math.max(0, differenceInCalendarDays(planEnd, date)),
  }
}

/**
 * Número de fase "efectivo" para una fecha: 0 antes del plan, la fase actual
 * durante el plan y phases.length + 1 después (todo activo).
 */
export function effectivePhaseNumber(phases: PlanPhase[], date: Date): number {
  const s = getPhaseStatus(phases, date)
  if (s.kind === 'before') return 0
  if (s.kind === 'after') return phases.length + 1
  return s.phase.id
}

/** ¿Se mide este indicador en la fase dada? */
export function kpiActive(kpi: WeeklyKpi, phaseNumber: number): boolean {
  return !kpi.fromPhase || phaseNumber >= kpi.fromPhase
}

/** Meta numérica del indicador o null si es texto / sin meta. */
export function kpiNumericTarget(kpi: WeeklyKpi): number | null {
  return typeof kpi.target === 'number' ? kpi.target : null
}

/** XP que da cada ítem del checklist de 90 días. El primer cliente vale más. */
export function checklistXP(id: string): number {
  return id === 'g90-5' ? 500 : 100
}

export const PHASE_TASK_XP = 25
export const REVIEW_XP = 50

/**
 * La revisión da XP solo si es de esta semana o de la anterior (se puede
 * llenar el lunes). Registrar semanas viejas queda como historial, sin XP.
 */
export function reviewEarnsXP(weekStart: string, now: Date = new Date()): boolean {
  return weekStart >= weekStartKey(addWeeks(now, -1)) && weekStart <= weekStartKey(now)
}

/** Clave estable de una tarea de fase: `fase:área:índice`. */
export function phaseTaskKey(phaseId: number, area: 'business' | 'trading' | 'reading', idx: number): string {
  return `${phaseId}:${area}:${idx}`
}
