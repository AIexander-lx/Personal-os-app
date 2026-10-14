import { describe, it, expect } from 'vitest'
import { plan } from '@/data/plan'
import {
  dayCodeOf,
  effectivePhaseNumber,
  getPhaseStatus,
  kpiActive,
  kpiNumericTarget,
  phaseForDate,
  weekStartKey,
  checklistXP,
  reviewEarnsXP,
} from './plan'

// Fechas locales (sin 'Z') para no depender de la zona horaria.
const d = (s: string) => new Date(`${s}T12:00:00`)
const { phases, weeklyKpis } = plan

describe('getPhaseStatus', () => {
  it('antes del plan cuenta los días que faltan', () => {
    const s = getPhaseStatus(phases, d('2026-10-13'))
    expect(s.kind).toBe('before')
    if (s.kind === 'before') {
      expect(s.daysUntil).toBe(6)
      expect(s.next.id).toBe(1)
    }
  })

  it('el primer día es la fase 1, día 1', () => {
    const s = getPhaseStatus(phases, d('2026-10-19'))
    expect(s.kind).toBe('active')
    if (s.kind === 'active') {
      expect(s.phase.id).toBe(1)
      expect(s.dayOfPhase).toBe(1)
      expect(s.phaseDays).toBe(14)
      expect(s.daysLeft).toBe(13)
    }
  })

  it('el último día de una fase sigue en esa fase y el siguiente cambia', () => {
    const a = getPhaseStatus(phases, d('2026-11-01'))
    const b = getPhaseStatus(phases, d('2026-11-02'))
    expect(a.kind === 'active' && a.phase.id).toBe(1)
    expect(a.kind === 'active' && a.daysLeft).toBe(0)
    expect(b.kind === 'active' && b.phase.id).toBe(2)
  })

  it('fase de exámenes y último día del plan', () => {
    expect(phaseForDate(phases, d('2026-12-05'))?.name).toBe('Exámenes')
    const s = getPhaseStatus(phases, d('2027-01-10'))
    expect(s.kind === 'active' && s.phase.id).toBe(6)
    expect(s.kind === 'active' && s.planProgress).toBe(100)
    expect(s.kind === 'active' && s.planDaysLeft).toBe(0)
  })

  it('después del plan', () => {
    const s = getPhaseStatus(phases, d('2027-01-12'))
    expect(s.kind).toBe('after')
    if (s.kind === 'after') expect(s.daysSince).toBe(2)
  })
})

describe('semanas e indicadores', () => {
  it('weekStartKey devuelve el lunes', () => {
    expect(weekStartKey(d('2026-10-25'))).toBe('2026-10-19') // domingo
    expect(weekStartKey(d('2026-10-19'))).toBe('2026-10-19') // lunes
    expect(weekStartKey(d('2026-10-21'))).toBe('2026-10-19')
  })

  it('dayCodeOf', () => {
    expect(dayCodeOf(d('2026-10-13'))).toBe('TU')
    expect(dayCodeOf(d('2026-10-18'))).toBe('SU')
  })

  it('effectivePhaseNumber', () => {
    expect(effectivePhaseNumber(phases, d('2026-10-01'))).toBe(0)
    expect(effectivePhaseNumber(phases, d('2026-11-20'))).toBe(3)
    expect(effectivePhaseNumber(phases, d('2027-02-01'))).toBe(7)
  })

  it('los indicadores con fromPhase se activan en su fase', () => {
    const contactados = weeklyKpis.find((k) => k.id === 'negocios_contactados')!
    const horas = weeklyKpis.find((k) => k.id === 'horas_negocio')!
    expect(kpiActive(contactados, 2)).toBe(false)
    expect(kpiActive(contactados, 3)).toBe(true)
    expect(kpiActive(horas, 0)).toBe(true)
  })

  it('meta numérica solo cuando es número', () => {
    expect(kpiNumericTarget(weeklyKpis.find((k) => k.id === 'paginas')!)).toBe(50)
    expect(kpiNumericTarget(weeklyKpis.find((k) => k.id === 'aporte_sp500')!)).toBeNull()
    expect(kpiNumericTarget(weeklyKpis.find((k) => k.id === 'ingresos')!)).toBeNull()
  })

  it('reviewEarnsXP: semana actual y anterior sí, otras no', () => {
    const now = d('2026-11-22') // domingo, semana del 16 nov
    expect(reviewEarnsXP('2026-11-16', now)).toBe(true)
    expect(reviewEarnsXP('2026-11-09', now)).toBe(true)
    expect(reviewEarnsXP('2026-11-02', now)).toBe(false)
    expect(reviewEarnsXP('2026-11-23', now)).toBe(false)
  })

  it('el primer cliente vale más XP', () => {
    expect(checklistXP('g90-5')).toBeGreaterThan(checklistXP('g90-1'))
  })
})
