import { format, isAfter, parseISO, subDays } from 'date-fns'
import type { XPEvent } from '@/types'
import { localDayKey } from './formatters'

/** Días que se guardan en el historial de XP (el gráfico usa 30). */
export const XP_LOG_DAYS = 60

/** Descarta eventos más viejos que XP_LOG_DAYS para no crecer sin límite. */
export function trimXPLog(log: XPEvent[], now: Date = new Date()): XPEvent[] {
  const limit = subDays(now, XP_LOG_DAYS)
  return log.filter((e) => isAfter(parseISO(e.date), limit))
}

/**
 * XP acumulado por día en los últimos `days` días, terminando hoy.
 * `events` incluye todo lo que movió el XP (sesiones, plan, diario, logros).
 * El punto de partida es el total actual menos lo ganado en la ventana, así
 * la curva siempre termina en el total real aunque falten eventos viejos.
 */
export function xpSeries(
  events: XPEvent[],
  totalXP: number,
  today: Date = new Date(),
  days = 30,
): { label: string; value: number }[] {
  const windowStart = subDays(today, days)
  const inWindow = events.filter((e) => isAfter(parseISO(e.date), windowStart))
  const byDay = new Map<string, number>()
  for (const e of inWindow) {
    const k = localDayKey(e.date)
    byDay.set(k, (byDay.get(k) ?? 0) + e.xp)
  }
  let cumulative = totalXP - inWindow.reduce((s, e) => s + e.xp, 0)
  return Array.from({ length: days }, (_, i) => subDays(today, days - 1 - i)).map((d) => {
    cumulative += byDay.get(format(d, 'yyyy-MM-dd')) ?? 0
    return { label: format(d, 'd/M'), value: Math.max(0, cumulative) }
  })
}

/** XP ganado cada día (no acumulado) en los últimos `days` días, terminando hoy. */
export function xpDaily(
  events: XPEvent[],
  today: Date = new Date(),
  days = 30,
): { key: string; label: string; value: number }[] {
  const byDay = new Map<string, number>()
  for (const e of events) {
    const k = localDayKey(e.date)
    byDay.set(k, (byDay.get(k) ?? 0) + e.xp)
  }
  return Array.from({ length: days }, (_, i) => subDays(today, days - 1 - i)).map((d) => {
    const key = format(d, 'yyyy-MM-dd')
    return { key, label: format(d, 'd/M'), value: Math.max(0, byDay.get(key) ?? 0) }
  })
}

/**
 * Días seguidos ganando XP, hasta hoy. Si hoy todavía no ganaste, la racha
 * sigue viva desde ayer (no se corta hasta que termine el día).
 */
export function xpStreak(events: XPEvent[], today: Date = new Date()): number {
  const days = new Set<string>()
  const byDay = new Map<string, number>()
  for (const e of events) {
    const k = localDayKey(e.date)
    byDay.set(k, (byDay.get(k) ?? 0) + e.xp)
  }
  for (const [k, xp] of byDay) if (xp > 0) days.add(k)
  let cursor = days.has(format(today, 'yyyy-MM-dd')) ? today : subDays(today, 1)
  let streak = 0
  while (days.has(format(cursor, 'yyyy-MM-dd'))) {
    streak++
    cursor = subDays(cursor, 1)
  }
  return streak
}
