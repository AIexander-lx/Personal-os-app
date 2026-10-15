import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GymEntry, SleepEntry, EnergyEntry, User, XPEvent } from '@/types'
import { getLevelInfo, todayKey, trimXPLog } from '@/utils'

interface UserState {
  user: User
  gym: GymEntry[]
  sleep: SleepEntry[]
  energy: EnergyEntry[]
  /** Historial de XP (plan, diario, logros), para el gráfico del Dashboard. */
  xpLog: XPEvent[]
  /** Contadores manuales para logros sin fuente de datos automática. */
  githubCommits: number
  peersHelped: number

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
  joinDate: '2026-07-14',
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: initialUser,
      gym: [],
      sleep: [],
      energy: [],
      xpLog: [],
      githubCommits: 0,
      peersHelped: 0,

      addXP: (xp) =>
        set((state) => {
          // Nunca por debajo de 0 (desmarcar tareas del plan resta XP).
          const totalXP = Math.max(0, state.user.totalXP + xp)
          // Se registra el cambio real (puede ser menor si se topó en 0).
          const applied = totalXP - state.user.totalXP
          return {
            user: { ...state.user, totalXP, level: getLevelInfo(totalXP).level },
            xpLog: applied
              ? trimXPLog([...state.xpLog, { date: new Date().toISOString(), xp: applied }])
              : state.xpLog,
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
          gym: [],
          sleep: [],
          energy: [],
          xpLog: [],
          githubCommits: 0,
          peersHelped: 0,
        }),
    }),
    { name: 'user-store' },
  ),
)

export { todayKey }
