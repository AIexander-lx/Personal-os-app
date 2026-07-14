import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export function formatDate(iso: string): string {
  try {
    return format(parseISO(iso), "d MMM yyyy", { locale: es })
  } catch {
    return iso
  }
}

export function formatDateTime(iso: string): string {
  try {
    return format(parseISO(iso), "d MMM · HH:mm", { locale: es })
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

/** Segundos → "mm:ss". */
export function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function formatXP(xp: number): string {
  return `${Math.round(xp).toLocaleString('es-PE')} XP`
}

export const todayKey = (): string => format(new Date(), 'yyyy-MM-dd')
