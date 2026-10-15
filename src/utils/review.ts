import { addDays, format, parseISO } from 'date-fns'
import type { GymEntry, IncomeEntry, Investment, Trade, WeeklyReview } from '@/types'
import { demoTradesInWeek } from './journal'

interface SuggestionSources {
  /** Lunes de la semana, yyyy-MM-dd. */
  weekStart: string
  readingLog: Record<string, number>
  gym: GymEntry[]
  trades: Trade[]
  income: IncomeEntry[]
  investments: Investment[]
  /** Moneda en la que se registran ingresos e inversiones en la app. */
  currency: string
}

/**
 * Valores de los indicadores semanales que la app ya conoce por otras
 * pestañas. Ingresos (en PEN en el plan) y aporte (en USD) solo se sugieren
 * si la moneda de la app coincide con la del indicador.
 */
export function weekSuggestions(s: SuggestionSources): Record<string, number> {
  const end = format(addDays(parseISO(s.weekStart), 7), 'yyyy-MM-dd')
  const inWeek = (date: string) => date >= s.weekStart && date < end
  const sum = (list: { date: string; amount: number }[]) => list.filter((x) => inWeek(x.date)).reduce((t, x) => t + x.amount, 0)

  const out: Record<string, number> = {
    paginas: Object.entries(s.readingLog)
      .filter(([d]) => inWeek(d))
      .reduce((t, [, n]) => t + n, 0),
    entrenamientos: s.gym.filter((g) => g.done && inWeek(g.date)).length,
    ops_demo: demoTradesInWeek(s.trades, s.weekStart),
  }
  if (s.currency === 'PEN') out.ingresos = sum(s.income)
  if (s.currency === 'USD') out.aporte_sp500 = sum(s.investments)
  return out
}

/** Semanas seguidas con revisión guardada, contando hacia atrás desde `weekStart` (o la anterior si esta falta). */
export function reviewStreak(reviews: WeeklyReview[], weekStart: string): number {
  const have = new Set(reviews.map((r) => r.weekStart))
  let cursor = parseISO(weekStart)
  if (!have.has(weekStart)) cursor = addDays(cursor, -7)
  let streak = 0
  while (have.has(format(cursor, 'yyyy-MM-dd'))) {
    streak++
    cursor = addDays(cursor, -7)
  }
  return streak
}
