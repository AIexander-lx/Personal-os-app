import { describe, it, expect } from 'vitest'
import type { DayCode, Evaluation } from '@/types'
import {
  dailyPace,
  daysLeftInMonth,
  gradeStatus,
  incomeOfMonth,
  incomeTarget,
  sumMonth,
  trainingMonth,
  dayCompletion,
} from './goals'

// Fechas locales (sin 'Z') para no depender de la zona horaria.
const d = (s: string) => new Date(`${s}T12:00:00`)
const ev = (weight: number, grade: number | null): Evaluation => ({ id: String(Math.random()), name: 'x', weight, grade })

describe('dailyPace', () => {
  it('reparte lo que falta entre los días que quedan', () => {
    expect(dailyPace(210, 0, 30)).toBe(7)
    // Un día sin leer sube un poco la meta del resto del mes.
    expect(dailyPace(210, 0, 29)).toBe(8)
  })

  it('si ya llegaste a la meta, hoy no toca nada', () => {
    expect(dailyPace(100, 120, 5)).toBe(0)
  })
})

describe('daysLeftInMonth', () => {
  it('cuenta hoy', () => {
    expect(daysLeftInMonth(d('2026-10-15'))).toBe(17)
    expect(daysLeftInMonth(d('2026-10-31'))).toBe(1)
  })
})

describe('sumMonth', () => {
  it('suma solo el mes pedido y, si se indica, antes de una fecha', () => {
    const log = { '2026-09-30': 10, '2026-10-01': 5, '2026-10-14': 7, '2026-10-15': 3 }
    expect(sumMonth(log, '2026-10')).toBe(15)
    expect(sumMonth(log, '2026-10', '2026-10-15')).toBe(12)
  })
})

describe('trainingMonth', () => {
  it('cuenta programados, hechos, perdidos y restantes', () => {
    // Octubre 2026: martes 6,13,20,27 y sábados 3,10,17,24,31.
    const days = new Set<DayCode>(['TU', 'SA'])
    const done = new Set(['2026-10-03', '2026-10-06', '2026-10-13'])
    expect(trainingMonth(days, done, d('2026-10-15'))).toEqual({
      planned: 9,
      elapsed: 4,
      done: 3,
      missed: 1,
      remaining: 5,
    })
  })
})

describe('incomeTarget', () => {
  const goal = { startMonth: '2026-10', base: 100, step: 50, currency: 'USD' }
  it('sube un escalón por mes desde el arranque', () => {
    expect(incomeTarget(goal, '2026-10')).toBe(100)
    expect(incomeTarget(goal, '2027-01')).toBe(250)
  })
  it('antes del arranque se queda en la base', () => {
    expect(incomeTarget(goal, '2026-08')).toBe(100)
  })
  it('suma los ingresos del mes', () => {
    const entries = [
      { id: '1', date: '2026-10-02', amount: 40 },
      { id: '2', date: '2026-10-20', amount: 25 },
      { id: '3', date: '2026-11-01', amount: 99 },
    ]
    expect(incomeOfMonth(entries, '2026-10')).toBe(65)
  })
})

describe('gradeStatus', () => {
  it('calcula la nota que falta en lo pendiente', () => {
    const s = gradeStatus([ev(30, 10), ev(30, null), ev(40, null)], 11)
    expect(s.secured).toBeCloseTo(3)
    expect(s.remainingWeight).toBe(70)
    expect(s.needed).toBeCloseTo(80 / 7) // ≈ 11.43
    expect(s.state).toBe('en-camino')
  })

  it('marca riesgo e imposible', () => {
    expect(gradeStatus([ev(50, 6), ev(50, null)], 11).state).toBe('en-riesgo') // necesita 16
    expect(gradeStatus([ev(70, 4), ev(30, null)], 11).state).toBe('imposible') // necesita > 20
  })

  it('aprobado asegurado antes de terminar', () => {
    const s = gradeStatus([ev(60, 19), ev(40, null)], 11)
    expect(s.needed).toBe(0)
    expect(s.state).toBe('aprobado')
  })

  it('con todo rendido decide aprobado o desaprobado', () => {
    expect(gradeStatus([ev(50, 12), ev(50, 11)], 11).state).toBe('aprobado')
    expect(gradeStatus([ev(50, 10), ev(50, 11)], 11).state).toBe('desaprobado')
  })

  it('sin evaluaciones no hay datos', () => {
    expect(gradeStatus([], 11).state).toBe('sin-datos')
  })
})

describe('dayCompletion', () => {
  const base = { habits: 2, habitsDone: 1, studied: true, pages: 7, pagesPerDay: 7, trainingDay: false, trained: false }
  it('cuenta hábitos, estudio y lectura', () => {
    expect(dayCompletion(base)).toEqual({ done: 3, total: 4 })
  })
  it('el entrenamiento solo cuenta en días de entrenamiento', () => {
    expect(dayCompletion({ ...base, trainingDay: true })).toEqual({ done: 3, total: 5 })
    expect(dayCompletion({ ...base, trainingDay: true, trained: true })).toEqual({ done: 4, total: 5 })
  })
  it('la lectura se mide contra la meta base', () => {
    expect(dayCompletion({ ...base, pages: 6 }).done).toBe(2)
  })
})
