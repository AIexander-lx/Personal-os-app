import { describe, it, expect } from 'vitest'
import { formatClock, formatDuration, formatXP } from './formatters'

describe('formatClock', () => {
  it('formatea segundos como mm:ss con padding', () => {
    expect(formatClock(0)).toBe('00:00')
    expect(formatClock(65)).toBe('01:05')
    expect(formatClock(600)).toBe('10:00')
    expect(formatClock(45 * 60)).toBe('45:00')
  })
})

describe('formatDuration', () => {
  it('solo minutos', () => {
    expect(formatDuration(45)).toBe('45m')
  })
  it('horas exactas', () => {
    expect(formatDuration(60)).toBe('1h')
    expect(formatDuration(120)).toBe('2h')
  })
  it('horas y minutos', () => {
    expect(formatDuration(90)).toBe('1h 30m')
  })
})

describe('formatXP', () => {
  it('redondea y añade sufijo XP', () => {
    expect(formatXP(0)).toBe('0 XP')
    expect(formatXP(73)).toBe('73 XP')
    expect(formatXP(72.5)).toBe('73 XP')
  })

  it('incluye el número y el sufijo para valores grandes', () => {
    const out = formatXP(1250)
    expect(out).toContain('XP')
    expect(out).toMatch(/1.?250/) // separador de miles según locale
  })
})
