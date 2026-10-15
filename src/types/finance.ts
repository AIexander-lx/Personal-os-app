export type ExpenseCategory = 'comida' | 'transporte' | 'estudios' | 'negocio' | 'ocio' | 'otros'

export interface Expense {
  id: string
  date: string // yyyy-MM-dd
  amount: number
  category: ExpenseCategory
  note?: string
}

/** Aporte a inversión (p. ej. S&P 500, regla del 20-30 %). */
export interface Investment {
  id: string
  date: string // yyyy-MM-dd
  amount: number
  note?: string
}
