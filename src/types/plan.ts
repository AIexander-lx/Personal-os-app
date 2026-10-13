/** Códigos de día (iCal), lunes a domingo. */
export type DayCode = 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU'

export type BlockCategory = 'negocio' | 'estudio' | 'salud' | 'trading' | 'lectura' | 'revision'

export type GoalHorizon = '90d' | '1y' | '3y' | '10y'

export interface ChecklistItem {
  id: string
  text: string
  done: boolean
}

export interface GoalTarget {
  metric: string
  target: string
}

export interface Goal {
  id: string
  horizon: GoalHorizon
  deadline: string // yyyy-MM-dd
  title: string
  checklist?: ChecklistItem[]
  targets?: GoalTarget[]
}

export interface PlanPhase {
  id: number
  name: string
  start: string // yyyy-MM-dd (inclusive)
  end: string // yyyy-MM-dd (inclusive)
  business: string[]
  trading: string[]
  reading: string | null
}

export interface WeeklyBlock {
  day: DayCode
  start: string
  end: string
  category: BlockCategory
  title: string
}

export interface WeeklyKpi {
  id: string
  label: string
  /** Número, texto libre (p. ej. "20-30% de lo ganado") o null si no hay meta fija. */
  target: number | string | null
  unit: string
  /** Fase del temario desde la que se mide este indicador. */
  fromPhase?: number
}

export interface Plan {
  plan: string
  version: number
  createdAt: string
  rules: string[]
  goals: Goal[]
  phases: PlanPhase[]
  weeklyBlocks: WeeklyBlock[]
  weeklyKpis: WeeklyKpi[]
}

/** Registro de la revisión de una semana (lunes a domingo). */
export interface WeeklyReview {
  /** Lunes de la semana, yyyy-MM-dd. */
  weekStart: string
  values: Record<string, number | null>
  note?: string
  savedAt: string // ISO
}
