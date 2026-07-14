import type { Course, Topic } from '@/types'

export interface LevelInfo {
  level: number
  title: string
  min: number
  max: number
}

/** 10 niveles profesionales. `max` es exclusivo salvo el último. */
export const LEVELS: LevelInfo[] = [
  { level: 1, title: 'Beginner', min: 0, max: 500 },
  { level: 2, title: 'Code Apprentice', min: 500, max: 1000 },
  { level: 3, title: 'Developer', min: 1000, max: 1500 },
  { level: 4, title: 'Senior Developer', min: 1500, max: 2000 },
  { level: 5, title: 'Tech Lead', min: 2000, max: 2500 },
  { level: 6, title: 'Architect', min: 2500, max: 3000 },
  { level: 7, title: 'Staff Engineer', min: 3000, max: 3500 },
  { level: 8, title: 'Principal Engineer', min: 3500, max: 4000 },
  { level: 9, title: 'Distinguished Engineer', min: 4000, max: 4500 },
  { level: 10, title: 'Master Architect', min: 4500, max: Infinity },
]

export const BASE_XP_PER_SESSION = 50
export const XP_PER_MINUTE = 0.5

/** XP de una sesión: base + bonus por duración. */
export function sessionXP(durationMinutes: number): number {
  return Math.round(BASE_XP_PER_SESSION + durationMinutes * XP_PER_MINUTE)
}

export function getLevelInfo(totalXP: number): LevelInfo {
  return (
    LEVELS.find((l) => totalXP >= l.min && totalXP < l.max) ??
    LEVELS[LEVELS.length - 1]
  )
}

/** Progreso (0-100) dentro del nivel actual. */
export function levelProgress(totalXP: number): number {
  const info = getLevelInfo(totalXP)
  if (!isFinite(info.max)) return 100
  const span = info.max - info.min
  return Math.min(100, Math.round(((totalXP - info.min) / span) * 100))
}

/** XP restante para el siguiente nivel (0 si ya es máximo). */
export function xpToNextLevel(totalXP: number): number {
  const info = getLevelInfo(totalXP)
  if (!isFinite(info.max)) return 0
  return info.max - totalXP
}

/** Progreso de un tema según ejercicios completados. */
export function topicProgress(topic: Topic): number {
  if (!topic.exercises) return 0
  const done = topic.completedExercises ?? 0
  return Math.min(100, Math.round((done / topic.exercises) * 100))
}

/** Progreso de un curso: promedio ponderado por ejercicios completados. */
export function courseProgress(course: Course): number {
  const totalEx = course.topics.reduce((s, t) => s + t.exercises, 0)
  if (!totalEx) return course.progress
  const doneEx = course.topics.reduce((s, t) => s + (t.completedExercises ?? 0), 0)
  return Math.round((doneEx / totalEx) * 100)
}

export function courseStatus(progress: number): 'not-started' | 'in-progress' | 'completed' {
  if (progress <= 0) return 'not-started'
  if (progress >= 100) return 'completed'
  return 'in-progress'
}
