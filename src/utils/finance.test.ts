import { describe, it, expect } from 'vitest'
import { investTarget, monthMoney, netChange, prevMonth } from './finance'

const income = [
  { date: '2026-10-02', amount: 500 },
  { date: '2026-10-20', amount: 500 },
  { date: '2026-09-15', amount: 800 },
]
const expenses = [
  { date: '2026-10-05', amount: 300 },
  { date: '2026-09-01', amount: 100 },
]
const investments = [{ date: '2026-10-03', amount: 200 }]

describe('monthMoney', () => {
  it('suma solo el mes pedido y calcula tasas', () => {
    const m = monthMoney(income, expenses, investments, '2026-10')
    expect(m).toMatchObject({ income: 1000, expenses: 300, invested: 200, saved: 500, net: 700 })
    expect(m.savingsRate).toBe(70)
    expect(m.investRate).toBe(20)
  })

  it('sin ingresos las tasas son null', () => {
    const m = monthMoney([], expenses, [], '2026-10')
    expect(m.savingsRate).toBeNull()
    expect(m.net).toBe(-300)
  })
})

describe('netChange', () => {
  it('compara contra el mes anterior', () => {
    expect(netChange(700, 700 / 1.12)).toBeCloseTo(12)
  })
  it('null si el mes anterior no tuvo neto positivo', () => {
    expect(netChange(700, 0)).toBeNull()
    expect(netChange(700, -50)).toBeNull()
  })
})

describe('helpers', () => {
  it('prevMonth cruza años', () => {
    expect(prevMonth('2027-01')).toBe('2026-12')
  })
  it('investTarget aplica el 20-30 %', () => {
    expect(investTarget(1000)).toEqual({ min: 200, max: 300 })
  })
})
