import { addMonths, format, parseISO } from 'date-fns'

interface Dated {
  date: string
  amount: number
}

/** Regla del plan: invertir entre el 20 % y el 30 % de cada ingreso. */
export const INVEST_RULE = { min: 0.2, max: 0.3 }

const sumMonth = (list: Dated[], month: string) =>
  list.filter((x) => x.date.startsWith(month)).reduce((s, x) => s + x.amount, 0)

export interface MonthMoney {
  income: number
  expenses: number
  invested: number
  /** Lo que queda después de gastos e inversión. */
  saved: number
  /** Ingresos − gastos. */
  net: number
  /** (ingresos − gastos) / ingresos, 0-100; null sin ingresos. */
  savingsRate: number | null
  /** Inversión / ingresos, 0-100; null sin ingresos. */
  investRate: number | null
}

export function monthMoney(income: Dated[], expenses: Dated[], investments: Dated[], month: string): MonthMoney {
  const inc = sumMonth(income, month)
  const exp = sumMonth(expenses, month)
  const inv = sumMonth(investments, month)
  return {
    income: inc,
    expenses: exp,
    invested: inv,
    saved: inc - exp - inv,
    net: inc - exp,
    savingsRate: inc > 0 ? ((inc - exp) / inc) * 100 : null,
    investRate: inc > 0 ? (inv / inc) * 100 : null,
  }
}

/** Mes anterior (yyyy-MM). */
export function prevMonth(month: string): string {
  return format(addMonths(parseISO(`${month}-01`), -1), 'yyyy-MM')
}

/** Variación % del neto contra el mes anterior; null si el mes anterior no tiene neto positivo. */
export function netChange(current: number, previous: number): number | null {
  if (previous <= 0) return null
  return ((current - previous) / previous) * 100
}

/** Cuánto debería invertirse este mes según la regla (rango mínimo-máximo). */
export function investTarget(income: number): { min: number; max: number } {
  return { min: income * INVEST_RULE.min, max: income * INVEST_RULE.max }
}
