import { describe, it, expect } from 'vitest'
import type { Trade } from '@/types'
import { reviewStreak, weekSuggestions } from './review'

const WEEK = '2026-10-19' // lunes

const trade = (date: string, account: 'demo' | 'real' = 'demo'): Trade => ({
  id: date,
  date,
  pair: 'EURUSD',
  direction: 'long',
  account,
  entry: 1,
  stopLoss: 0.9,
  exit: null,
  pnlUsd: null,
  followedRules: true,
  reason: '',
  createdAt: date,
})

const base = {
  weekStart: WEEK,
  readingLog: { '2026-10-18': 99, '2026-10-19': 10, '2026-10-25': 5, '2026-10-26': 99 },
  gym: [
    { date: '2026-10-20', done: true },
    { date: '2026-10-24', done: false },
  ],
  trades: [trade('2026-10-21T10:00'), trade('2026-10-22T10:00', 'real'), trade('2026-10-27T10:00')],
  income: [{ id: 'a', date: '2026-10-21', amount: 300 }],
  investments: [{ id: 'b', date: '2026-10-22', amount: 60 }],
}

describe('weekSuggestions', () => {
  it('suma solo lunes a domingo de la semana', () => {
    const s = weekSuggestions({ ...base, currency: 'USD' })
    expect(s.paginas).toBe(15)
    expect(s.entrenamientos).toBe(1)
    expect(s.ops_demo).toBe(1)
  })

  it('ingresos (PEN) y aporte (USD) solo con la moneda que coincide', () => {
    const usd = weekSuggestions({ ...base, currency: 'USD' })
    expect(usd.aporte_sp500).toBe(60)
    expect(usd.ingresos).toBeUndefined()
    const pen = weekSuggestions({ ...base, currency: 'PEN' })
    expect(pen.ingresos).toBe(300)
    expect(pen.aporte_sp500).toBeUndefined()
  })
})

describe('reviewStreak', () => {
  const r = (weekStart: string) => ({ weekStart, values: {}, savedAt: '' })
  it('cuenta semanas seguidas', () => {
    expect(reviewStreak([r('2026-10-05'), r('2026-10-12'), r('2026-10-19')], '2026-10-19')).toBe(3)
  })
  it('si esta semana falta, cuenta desde la anterior', () => {
    expect(reviewStreak([r('2026-10-05'), r('2026-10-12')], '2026-10-19')).toBe(2)
  })
  it('un hueco corta la racha', () => {
    expect(reviewStreak([r('2026-09-28'), r('2026-10-12')], '2026-10-12')).toBe(1)
  })
})
