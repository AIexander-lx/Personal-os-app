export interface GymEntry {
  date: string // yyyy-MM-dd
  done: boolean
  intensity?: number // 1-10
}

export interface SleepEntry {
  date: string // yyyy-MM-dd
  hours: number
  quality: number // 1-10
}

export interface EnergyEntry {
  date: string // yyyy-MM-dd
  level: number // 1-10
}

/** Movimiento de XP que no viene de una sesión de estudio (plan, diario, logros). */
export interface XPEvent {
  date: string // ISO
  xp: number
}

export interface User {
  id: string
  name: string
  level: number
  totalXP: number
  joinDate: string
}
