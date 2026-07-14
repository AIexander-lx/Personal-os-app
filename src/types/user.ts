export interface StudySession {
  id: string
  courseId: string
  courseName: string
  topicId: string
  topicName: string
  /** Duration in minutes. */
  duration: number
  xp: number
  date: string // ISO string
}

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

export interface User {
  id: string
  name: string
  level: number
  totalXP: number
  streak: number
  sessions: number
  joinDate: string
}
