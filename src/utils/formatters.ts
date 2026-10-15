import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export function formatDate(iso: string): string {
  try {
    return format(parseISO(iso), "d MMM yyyy", { locale: es })
  } catch {
    return iso
  }
}

export function timeAgo(iso: string): string {
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true, locale: es })
  } catch {
    return iso
  }
}

/** Minutos → "1h 30m" / "45m". */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  if (h && m) return `${h}h ${m}m`
  if (h) return `${h}h`
  return `${m}m`
}

export function formatXP(xp: number): string {
  return `${Math.round(xp).toLocaleString('es-PE')} XP`
}

export const todayKey = (): string => format(new Date(), 'yyyy-MM-dd')

/**
 * Día local (yyyy-MM-dd) de una fecha ISO.
 * Ojo: NO usar `iso.slice(0, 10)` — eso da el día en UTC, que en Perú (UTC-5)
 * se adelanta a partir de las 19:00 locales y rompe las comparaciones con `todayKey()`.
 */
export function localDayKey(iso: string): string {
  try {
    return format(parseISO(iso), 'yyyy-MM-dd')
  } catch {
    return iso.slice(0, 10)
  }
}
