import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { StudySession, GymEntry, SleepEntry, EnergyEntry, User } from '@/types'
import { sessionXP, getLevelInfo, todayKey } from '@/utils'
import { differenceInCalendarDays, parseISO } from 'date-fns'

interface UserState {
  user: User
  sessions: StudySession[]
  gym: GymEntry[]
  sleep: SleepEntry[]
  energy: EnergyEntry[]
  /** Contadores manuales para logros sin fuente de datos automática. */
  githubCommits: number
  peersHelped: number

  addSession: (input: {
    courseId: string
    courseName: string
    topicId: string
    topicName: string
    duration: number
  }) => StudySession
  addXP: (xp: number) => void
  toggleGym: (date: string, intensity?: number) => void
  logSleep: (date: string, hours: number, quality: number) => void
  logEnergy: (date: string, level: number) => void
  setGithubCommits: (n: number) => void
  setPeersHelped: (n: number) => void
  resetAll: () => void
}

const initialUser: User = {
  id: 'user_001',
  name: 'Alexander',
  level: 1,
  totalXP: 0,
  streak: 0,
  sessions: 0,
  joinDate: '2026-07-14',
}

/** Recalcula la racha de estudio a partir de las fechas de sesión. */
function computeStreak(sessions: StudySession[], seed: number): number {
  if (sessions.length === 0) return seed
  const days = new Set(sessions.map((s) => s.date.slice(0, 10)))
  const sorted = [...days].sort().reverse()
  let streak = 0
  let cursor = new Date()
  for (const day of sorted) {
    const diff = differenceInCalendarDays(cursor, parseISO(day))
    if (diff <= 1) {
      streak += 1
      cursor = parseISO(day)
    } else {
      break
    }
  }
  return Math.max(streak, seed && sessions.length ? 0 : seed)
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: initialUser,
      sessions: [],
      gym: [],
      sleep: [],
      energy: [],
      githubCommits: 0,
      peersHelped: 0,

      addSession: (input) => {
        const xp = sessionXP(input.duration)
        const session: StudySession = {
          id: `sess_${Date.now()}`,
          ...input,
          xp,
          date: new Date().toISOString(),
        }
        set((state) => {
          const sessions = [session, ...state.sessions]
          const totalXP = state.user.totalXP + xp
          return {
            sessions,
            user: {
              ...state.user,
              totalXP,
              level: getLevelInfo(totalXP).level,
              sessions: state.user.sessions + 1,
              streak: computeStreak(sessions, state.user.streak),
            },
          }
        })
        return session
      },

      addXP: (xp) =>
        set((state) => {
          const totalXP = state.user.totalXP + xp
          return {
            user: { ...state.user, totalXP, level: getLevelInfo(totalXP).level },
          }
        }),

      toggleGym: (date, intensity) =>
        set((state) => {
          const existing = state.gym.find((g) => g.date === date)
          if (existing) {
            return {
              gym: state.gym.map((g) =>
                g.date === date ? { ...g, done: !g.done, intensity } : g,
              ),
            }
          }
          return { gym: [...state.gym, { date, done: true, intensity }] }
        }),

      logSleep: (date, hours, quality) =>
        set((state) => ({
          sleep: [
            ...state.sleep.filter((s) => s.date !== date),
            { date, hours, quality },
          ],
        })),

      logEnergy: (date, level) =>
        set((state) => ({
          energy: [
            ...state.energy.filter((e) => e.date !== date),
            { date, level },
          ],
        })),

      setGithubCommits: (n) => set({ githubCommits: Math.max(0, Math.round(n)) }),
      setPeersHelped: (n) => set({ peersHelped: Math.max(0, Math.round(n)) }),

      resetAll: () =>
        set({
          user: initialUser,
          sessions: [],
          gym: [],
          sleep: [],
          energy: [],
          githubCommits: 0,
          peersHelped: 0,
        }),
    }),
    { name: 'user-store' },
  ),
)

export { todayKey }
