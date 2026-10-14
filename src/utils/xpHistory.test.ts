import { describe, it, expect } from 'vitest'
import { xpSeries, trimXPLog } from './xpHistory'

const at = (s: string) => new Date(`${s}T12:00:00`).toISOString()
const today = new Date('2026-10-25T18:00:00')

describe('xpSeries', () => {
  it('termina en el total real y suma cada día en su lugar', () => {
    const events = [
      { date: at('2026-10-20'), xp: 100 },
      { date: at('2026-10-20'), xp: 25 },
      { date: at('2026-10-24'), xp: 50 },
    ]
    const s = xpSeries(events, 500, today, 7)
    expect(s).toHaveLength(7)
    expect(s[0].label).toBe('19/10')
    expect(s.at(-1)!.label).toBe('25/10')
    expect(s[0].value).toBe(325) // antes de los eventos
    expect(s[1].value).toBe(450) // 20/10: +125
    expect(s.at(-1)!.value).toBe(500)
  })

  it('los descuentos bajan la curva', () => {
    const events = [
      { date: at('2026-10-24'), xp: 100 },
      { date: at('2026-10-25'), xp: -100 },
    ]
    const s = xpSeries(events, 0, today, 3)
    expect(s.map((p) => p.value)).toEqual([0, 100, 0])
  })

  it('ignora eventos fuera de la ventana (ya están en la base)', () => {
    const s = xpSeries([{ date: at('2026-09-01'), xp: 300 }], 300, today, 7)
    expect(s.every((p) => p.value === 300)).toBe(true)
  })
})

describe('trimXPLog', () => {
  it('descarta eventos de más de 60 días', () => {
    const log = [
      { date: at('2026-07-01'), xp: 10 },
      { date: at('2026-10-01'), xp: 20 },
    ]
    expect(trimXPLog(log, today)).toEqual([log[1]])
  })
})
