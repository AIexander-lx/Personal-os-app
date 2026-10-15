import { differenceInCalendarMonths, endOfMonth, format, getDaysInMonth, parseISO } from 'date-fns'
import type { DayCode, Evaluation, IncomeEntry, IncomeGoal } from '@/types'
import { dayCodeOf } from './plan'

const keyOf = (date: Date) => format(date, 'yyyy-MM-dd')

/** Mes (yyyy-MM) de una fecha local. */
export function monthKey(date: Date): string {
  return format(date, 'yyyy-MM')
}

/** Días que quedan en el mes contando hoy (el último día del mes da 1). */
export function daysLeftInMonth(date: Date): number {
  return getDaysInMonth(date) - date.getDate() + 1
}

/**
 * Cuánto toca hoy para llegar a la meta: lo que falta repartido entre los días
 * que quedan (hoy incluido). Se recalcula cada día, así un día flojo sube un
 * poco la exigencia de los siguientes en vez de acumularse al final.
 */
export function dailyPace(target: number, doneBeforeToday: number, daysLeft: number): number {
  const remaining = target - doneBeforeToday
  if (remaining <= 0 || daysLeft <= 0) return 0
  return Math.ceil(remaining / daysLeft)
}

/** Suma de un registro diario (fecha → cantidad) dentro de un mes, opcionalmente antes de una fecha. */
export function sumMonth(log: Record<string, number>, month: string, before?: string): number {
  let total = 0
  for (const [date, n] of Object.entries(log)) {
    if (date.startsWith(month) && (!before || date < before)) total += n
  }
  return total
}

// --- Entrenamiento ---

export interface TrainingMonth {
  /** Días de entrenamiento del mes completo. */
  planned: number
  /** Días de entrenamiento hasta hoy (incluido). */
  elapsed: number
  done: number
  /** Días de entrenamiento ya pasados (antes de hoy) sin marcar. */
  missed: number
  remaining: number
}

/** Resumen del mes: días programados (según `trainingDays`) contra los marcados en `doneDates`. */
export function trainingMonth(trainingDays: Set<DayCode>, doneDates: Set<string>, today: Date): TrainingMonth {
  const todayKey = keyOf(today)
  const last = endOfMonth(today).getDate()
  const res: TrainingMonth = { planned: 0, elapsed: 0, done: 0, missed: 0, remaining: 0 }
  for (let d = 1; d <= last; d++) {
    const date = new Date(today.getFullYear(), today.getMonth(), d)
    if (!trainingDays.has(dayCodeOf(date))) continue
    const k = keyOf(date)
    res.planned++
    if (k <= todayKey) res.elapsed++
    if (doneDates.has(k)) res.done++
    else if (k < todayKey) res.missed++
    else res.remaining++
  }
  return res
}

// --- Ingresos ---

/** Meta del mes: la base más un escalón por cada mes desde el arranque (antes del arranque, la base). */
export function incomeTarget(goal: IncomeGoal, month: string): number {
  const n = differenceInCalendarMonths(parseISO(`${month}-01`), parseISO(`${goal.startMonth}-01`))
  return goal.base + goal.step * Math.max(0, n)
}

export function incomeOfMonth(entries: IncomeEntry[], month: string): number {
  return entries.filter((e) => e.date.startsWith(month)).reduce((s, e) => s + e.amount, 0)
}

// --- Notas ---

export type GradeState = 'sin-datos' | 'aprobado' | 'en-camino' | 'en-riesgo' | 'imposible' | 'desaprobado'

export interface GradeStatus {
  /** Puntos ya asegurados sobre 20 (suma de nota × peso). */
  secured: number
  /** Peso ya rendido, en %. */
  coveredWeight: number
  remainingWeight: number
  /** Promedio de lo rendido (sobre 20), o null si no hay notas. */
  average: number | null
  /** Nota mínima que necesitas en lo que falta para aprobar; null si ya no queda nada por rendir. */
  needed: number | null
  state: GradeState
}

/** Nota a partir de la cual "en camino" pasa a "en riesgo". */
export const RISKY_NEEDED = 14

/**
 * Estado de un curso: con las notas ya rendidas, cuánto necesitas en promedio
 * en las evaluaciones que faltan para llegar a `passing`. Si los pesos no
 * suman 100, el faltante cuenta como evaluaciones pendientes.
 */
export function gradeStatus(evaluations: Evaluation[], passing: number): GradeStatus {
  let secured = 0
  let coveredWeight = 0
  for (const e of evaluations) {
    if (e.grade == null) continue
    secured += (e.grade * e.weight) / 100
    coveredWeight += e.weight
  }
  const remainingWeight = Math.max(0, 100 - coveredWeight)
  const average = coveredWeight ? (secured * 100) / coveredWeight : null
  const base = { secured, coveredWeight, remainingWeight, average }

  if (!evaluations.length) return { ...base, needed: null, state: 'sin-datos' }
  if (remainingWeight === 0) {
    return { ...base, needed: null, state: secured >= passing ? 'aprobado' : 'desaprobado' }
  }
  const needed = Math.max(0, ((passing - secured) * 100) / remainingWeight)
  const state: GradeState =
    needed === 0 ? 'aprobado' : needed > 20 ? 'imposible' : needed >= RISKY_NEEDED ? 'en-riesgo' : coveredWeight ? 'en-camino' : 'sin-datos'
  return { ...base, needed, state }
}

// --- Cumplimiento diario ---

export interface DayInputs {
  /** Hábitos del checklist que aplican ese día. */
  habits: number
  habitsDone: number
  studied: boolean
  pages: number
  pagesPerDay: number
  trainingDay: boolean
  trained: boolean
}

/**
 * Cuánto se cumplió un día pasado. Para la historia la lectura se mide contra
 * la meta base (páginas por día), no contra el ritmo recalculado, y los
 * ingresos no cuentan: no llegan parejos día a día.
 */
export function dayCompletion(d: DayInputs): { done: number; total: number } {
  let total = d.habits + 2
  let done = d.habitsDone + (d.studied ? 1 : 0) + (d.pagesPerDay === 0 || d.pages >= d.pagesPerDay ? 1 : 0)
  if (d.trainingDay) {
    total++
    if (d.trained) done++
  }
  return { done, total }
}
