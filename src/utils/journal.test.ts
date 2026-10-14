import { describe, it, expect } from 'vitest'
import type { Trade } from '@/types'
import {
  tradeR,
  tradeOutcome,
  validateTrade,
  journalStats,
  demoClosedCount,
  demoTradesInWeek,
} from './journal'

const trade = (over: Partial<Trade> = {}): Trade => ({
  id: 't',
  date: '2026-10-20T09:00',
  pair: 'EURUSD',
  direction: 'long',
  account: 'demo',
  entry: 1.1,
  stopLoss: 1.095,
  exit: 1.11,
  pnlUsd: null,
  followedRules: true,
  reason: 'Rebote en soporte',
  createdAt: '2026-10-20T14:00:00Z',
  ...over,
})

describe('tradeR', () => {
  it('compra ganadora: +2R', () => {
    expect(tradeR(trade())).toBe(2)
  })
  it('compra que toca el stop: -1R', () => {
    expect(tradeR(trade({ exit: 1.095 }))).toBe(-1)
  })
  it('venta ganadora en oro', () => {
    expect(tradeR(trade({ pair: 'XAUUSD', direction: 'short', entry: 2400, stopLoss: 2410, exit: 2385 }))).toBe(1.5)
  })
  it('abierta o sin riesgo → null', () => {
    expect(tradeR(trade({ exit: null }))).toBeNull()
    expect(tradeR(trade({ stopLoss: 1.1 }))).toBeNull()
  })
})

describe('tradeOutcome', () => {
  it('clasifica', () => {
    expect(tradeOutcome(trade())).toBe('win')
    expect(tradeOutcome(trade({ exit: 1.095 }))).toBe('loss')
    expect(tradeOutcome(trade({ exit: 1.1 }))).toBe('breakeven')
    expect(tradeOutcome(trade({ exit: null }))).toBe('open')
  })
})

describe('validateTrade', () => {
  it('acepta una operación válida', () => {
    expect(validateTrade(trade())).toBeNull()
  })
  it('stop del lado equivocado', () => {
    expect(validateTrade(trade({ stopLoss: 1.12 }))).toMatch(/por debajo/)
    expect(validateTrade(trade({ direction: 'short', stopLoss: 1.09 }))).toMatch(/por encima/)
  })
  it('pide el motivo y precios válidos', () => {
    expect(validateTrade(trade({ reason: '  ' }))).toMatch(/por qué/)
    expect(validateTrade(trade({ entry: 0 }))).toMatch(/mayores a 0/)
  })
})

describe('journalStats', () => {
  const trades = [
    trade({ id: 'a', date: '2026-10-20T09:00' }), // +2
    trade({ id: 'b', date: '2026-10-21T09:00', exit: 1.095, followedRules: false }), // -1
    trade({ id: 'c', date: '2026-10-22T09:00', pair: 'XAUUSD', direction: 'short', entry: 2400, stopLoss: 2410, exit: 2385, pnlUsd: 30 }), // +1.5
    trade({ id: 'd', date: '2026-10-23T09:00', exit: null }), // abierta
  ]

  it('calcula acierto, R y reglas', () => {
    const s = journalStats(trades)
    expect(s.total).toBe(4)
    expect(s.closed).toBe(3)
    expect(s.open).toBe(1)
    expect(s.wins).toBe(2)
    expect(s.losses).toBe(1)
    expect(s.winRate).toBe(67)
    expect(s.totalR).toBe(2.5)
    expect(s.avgR).toBe(0.83)
    expect(s.pnlUsd).toBe(30)
    expect(s.rulesPct).toBe(75)
    expect(s.equity).toEqual([2, 1, 2.5])
  })

  it('agrupa por par', () => {
    const s = journalStats(trades)
    expect(s.byPair.find((p) => p.pair === 'EURUSD')).toMatchObject({ closed: 2, winRate: 50, totalR: 1 })
    expect(s.byPair.find((p) => p.pair === 'XAUUSD')).toMatchObject({ closed: 1, winRate: 100, totalR: 1.5 })
  })

  it('sin operaciones', () => {
    const s = journalStats([])
    expect(s.winRate).toBeNull()
    expect(s.avgR).toBeNull()
    expect(s.equity).toEqual([])
  })

  it('cuenta solo demo cerradas y por semana', () => {
    const all = [...trades, trade({ id: 'e', account: 'real' })]
    expect(demoClosedCount(all)).toBe(3)
    expect(demoTradesInWeek(all, '2026-10-19')).toBe(4)
    expect(demoTradesInWeek(all, '2026-10-26')).toBe(0)
  })
})
