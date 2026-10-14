import type { Trade, TradeInput } from '@/types'

/** Meta del checklist de 90 días: operaciones en demo registradas. */
export const JOURNAL_GOAL = 30
/** XP por cada operación registrada en el diario. */
export const TRADE_XP = 10
/** Pares del plan (solo demo en EURUSD y oro). */
export const PLAN_PAIRS = ['EURUSD', 'XAUUSD'] as const

/**
 * Resultado en R (múltiplos del riesgo inicial). 1R = distancia entre la
 * entrada y el stop loss. null si sigue abierta o el riesgo es 0.
 */
export function tradeR(t: Pick<Trade, 'direction' | 'entry' | 'stopLoss' | 'exit'>): number | null {
  if (t.exit == null) return null
  const risk = Math.abs(t.entry - t.stopLoss)
  if (!risk) return null
  const sign = t.direction === 'long' ? 1 : -1
  return Math.round(((sign * (t.exit - t.entry)) / risk) * 100) / 100
}

export type TradeOutcome = 'win' | 'loss' | 'breakeven' | 'open'

/** Ganadora, perdedora, en cero (|R| < 0.05) o abierta. */
export function tradeOutcome(t: Pick<Trade, 'direction' | 'entry' | 'stopLoss' | 'exit'>): TradeOutcome {
  const r = tradeR(t)
  if (r == null) return 'open'
  if (Math.abs(r) < 0.05) return 'breakeven'
  return r > 0 ? 'win' : 'loss'
}

/**
 * Valida una operación antes de guardarla. Devuelve el mensaje de error o
 * null si está bien.
 */
export function validateTrade(t: Partial<TradeInput>): string | null {
  if (!t.date) return 'Falta la fecha.'
  if (!t.pair?.trim()) return 'Falta el par.'
  const nums = [t.entry, t.stopLoss]
  if (nums.some((n) => n == null || !Number.isFinite(n) || n <= 0)) return 'Entrada y stop loss deben ser precios mayores a 0.'
  if (t.exit != null && (!Number.isFinite(t.exit) || t.exit <= 0)) return 'La salida debe ser un precio mayor a 0.'
  if (t.direction === 'long' && t.stopLoss! >= t.entry!) return 'En una compra, el stop loss va por debajo de la entrada.'
  if (t.direction === 'short' && t.stopLoss! <= t.entry!) return 'En una venta, el stop loss va por encima de la entrada.'
  if (!t.reason?.trim()) return 'Escribe por qué entraste.'
  return null
}

/** Operaciones en demo que cuentan para la meta (registradas y cerradas). */
export function demoClosedCount(trades: Trade[]): number {
  return trades.filter((t) => t.account === 'demo' && t.exit != null).length
}

/** Operaciones en demo con fecha dentro de la semana (lunes yyyy-MM-dd). */
export function demoTradesInWeek(trades: Trade[], weekStart: string): number {
  const start = new Date(`${weekStart}T00:00:00`)
  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  return trades.filter((t) => {
    if (t.account !== 'demo') return false
    const d = new Date(t.date)
    return d >= start && d < end
  }).length
}

export interface JournalStats {
  total: number
  closed: number
  open: number
  wins: number
  losses: number
  breakeven: number
  /** % de ganadoras sobre cerradas (0-100), null sin cerradas. */
  winRate: number | null
  avgR: number | null
  totalR: number
  pnlUsd: number
  /** % de operaciones que respetaron las reglas (0-100), null sin datos. */
  rulesPct: number | null
  /** R acumulado por operación cerrada, en orden cronológico. */
  equity: number[]
  byPair: { pair: string; closed: number; winRate: number | null; totalR: number }[]
}

const round2 = (n: number) => Math.round(n * 100) / 100

export function journalStats(trades: Trade[]): JournalStats {
  const chrono = [...trades].sort((a, b) => a.date.localeCompare(b.date))
  const closed = chrono.filter((t) => t.exit != null)
  const rs = closed.map((t) => tradeR(t) ?? 0)
  const outcomes = closed.map(tradeOutcome)
  const wins = outcomes.filter((o) => o === 'win').length
  const losses = outcomes.filter((o) => o === 'loss').length
  const totalR = round2(rs.reduce((s, r) => s + r, 0))

  let acc = 0
  const equity = rs.map((r) => (acc = round2(acc + r)))

  const pairs = [...new Set(chrono.map((t) => t.pair))].sort()
  const byPair = pairs.map((pair) => {
    const pc = closed.filter((t) => t.pair === pair)
    const pw = pc.filter((t) => tradeOutcome(t) === 'win').length
    return {
      pair,
      closed: pc.length,
      winRate: pc.length ? Math.round((pw / pc.length) * 100) : null,
      totalR: round2(pc.reduce((s, t) => s + (tradeR(t) ?? 0), 0)),
    }
  })

  return {
    total: trades.length,
    closed: closed.length,
    open: trades.length - closed.length,
    wins,
    losses,
    breakeven: closed.length - wins - losses,
    winRate: closed.length ? Math.round((wins / closed.length) * 100) : null,
    avgR: closed.length ? round2(totalR / closed.length) : null,
    totalR,
    pnlUsd: round2(trades.reduce((s, t) => s + (t.pnlUsd ?? 0), 0)),
    rulesPct: trades.length ? Math.round((trades.filter((t) => t.followedRules).length / trades.length) * 100) : null,
    equity,
    byPair,
  }
}
