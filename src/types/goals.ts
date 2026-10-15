/** Evaluación de un curso (escala vigesimal 0-20). */
export interface Evaluation {
  id: string
  name: string
  /** Peso en la nota final, en % (0-100). */
  weight: number
  /** Nota obtenida, o null si todavía no se rinde. */
  grade: number | null
}

/** Meta de ingresos que sube un monto fijo cada mes. */
export interface IncomeGoal {
  /** Mes de arranque, yyyy-MM. */
  startMonth: string
  /** Meta del mes de arranque. */
  base: number
  /** Cuánto sube la meta cada mes. */
  step: number
  currency: string
}

export interface IncomeEntry {
  id: string
  date: string // yyyy-MM-dd
  amount: number
  note?: string
}
