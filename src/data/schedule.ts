export interface TimeBlock {
  id: string
  label: string
  icon: string
  start: string // "HH:MM"
  end: string // "HH:MM"
  /** Solo días laborables (Lun–Vie). */
  weekdaysOnly?: boolean
  /** Ruta a la que enlaza el bloque, si aplica. */
  to?: string
}

/**
 * Estructura de día inamovible del usuario.
 * Los espacios entre bloques se muestran como tiempo libre.
 */
export const daySchedule: TimeBlock[] = [
  { id: 'gym', label: 'Gimnasio', icon: '💪', start: '06:00', end: '08:00', weekdaysOnly: true, to: '/health' },
  { id: 'deep', label: 'Deep Learning · estudio profundo', icon: '🧠', start: '09:00', end: '12:15', to: '/study' },
  { id: 'practice', label: 'Práctica y ejercicios', icon: '✏️', start: '13:00', end: '16:15', to: '/study' },
  { id: 'streak', label: 'StreakStudy', icon: '🚀', start: '17:00', end: '18:45', to: '/streakstudy' },
  { id: 'english', label: 'Inglés técnico', icon: '🌐', start: '19:45', end: '20:15' },
  { id: 'sleep', label: 'Dormir', icon: '😴', start: '22:30', end: '23:30' },
]

/** "HH:MM" → minutos desde medianoche. */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}
