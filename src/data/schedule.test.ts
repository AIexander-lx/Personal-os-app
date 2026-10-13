import { describe, it, expect } from 'vitest'
import { daySchedule, blockDays } from './schedule'
import { plan } from './plan'

describe('horario semanal del plan', () => {
  it('agrupa bloques iguales en distintos días (futsal mar y sáb)', () => {
    const futsal = daySchedule.filter((b) => b.label === 'Entrenamiento futsal')
    expect(futsal).toHaveLength(1)
    expect(futsal[0].days).toEqual(['TU', 'SA'])
  })

  it('no pierde ningún bloque del plan', () => {
    const total = daySchedule.reduce((s, b) => s + (b.days?.length ?? 0), 0)
    expect(total).toBe(plan.weeklyBlocks.length)
  })

  it('blockDays resuelve el legado weekdaysOnly', () => {
    expect(blockDays({ id: 'x', label: '', icon: '', start: '06:00', end: '07:00', weekdaysOnly: true })).toEqual([
      'MO', 'TU', 'WE', 'TH', 'FR',
    ])
    expect(blockDays({ id: 'y', label: '', icon: '', start: '06:00', end: '07:00' })).toHaveLength(7)
  })
})
