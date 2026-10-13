import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AchievementState } from '@/types'
import { achievements as seedAchievements } from '@/data/achievements'
import { useUserStore } from './userStore'
import { useCourseStore } from './courseStore'
import { useToastStore } from './toastStore'
import { usePlanStore } from './planStore'
import { goal90 } from '@/data/plan'
import { courseProgress, todayKey, localDayKey } from '@/utils'

interface GamificationState {
  achievements: AchievementState[]
  /** Revisa condiciones y desbloquea logros nuevos. Devuelve los recién desbloqueados. */
  evaluate: () => AchievementState[]
  unlock: (id: string) => void
  resetAchievements: () => void
}

const initial: AchievementState[] = seedAchievements.map((a) => ({
  ...a,
  // Todo empieza bloqueado: los logros se ganan usando la app.
  unlocked: false,
  unlockedAt: undefined,
}))

/**
 * Combina los logros guardados con la lista actual: agrega los nuevos
 * (p. ej. los del Plan Millonario) y conserva lo ya desbloqueado.
 */
export function mergeAchievements(saved: AchievementState[] | undefined): AchievementState[] {
  const byId = new Map((saved ?? []).map((a) => [a.id, a]))
  return initial.map((seed) => {
    const prev = byId.get(seed.id)
    return prev ? { ...seed, unlocked: prev.unlocked, unlockedAt: prev.unlockedAt } : seed
  })
}

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set) => ({
      achievements: initial,

      evaluate: () => {
        const { user, sessions, gym, sleep, energy, githubCommits, peersHelped } =
          useUserStore.getState()
        const { courses } = useCourseStore.getState()
        const { checklist, reviews } = usePlanStore.getState()
        const checklistIds = (goal90.checklist ?? []).map((c) => c.id)
        const plan90Done = checklistIds.length > 0 && checklistIds.every((id) => checklist[id])
        const totalHours =
          sessions.reduce((s, x) => s + x.duration, 0) / 60
        const aed = courses.find((c) => c.id === 'course_aed')
        const cloud = courses.find((c) => c.id === 'course_cloud')
        const ml = courses.find((c) => c.id === 'course_ml')

        // Perfect Day: gym + estudio + salud registrados hoy.
        const today = todayKey()
        const gymToday = gym.some((g) => g.date === today && g.done)
        const studyToday = sessions.some((s) => localDayKey(s.date) === today)
        const healthToday =
          sleep.some((s) => s.date === today) || energy.some((e) => e.date === today)
        const perfectDay = gymToday && studyToday && healthToday

        // All A's: los 6 cursos al 100%.
        const allAs = courses.length > 0 && courses.every((c) => courseProgress(c) >= 100)

        const isMet = (a: AchievementState): boolean => {
          switch (a.condition) {
            case 'first-session':
              return user.sessions >= 1
            case 'streak-7':
              return user.streak >= 7
            case 'hours-100':
              return totalHours >= 100
            case 'streak-30':
              return user.streak >= 30
            case 'level-10':
              return user.level >= 10
            case 'plan-first-client':
              return !!checklist['g90-5']
            case 'plan-90-complete':
              return plan90Done
            case 'review-1':
              return reviews.length >= 1
            case 'review-4':
              return reviews.length >= 4
            default:
              break
          }
          if (a.id === 'ach_4') return perfectDay
          if (a.id === 'ach_5') return !!aed && courseProgress(aed) >= 100
          if (a.id === 'ach_6') return !!cloud && courseProgress(cloud) >= 100
          if (a.id === 'ach_7') return !!ml && courseProgress(ml) >= 100
          if (a.id === 'ach_8') return allAs
          if (a.id === 'ach_9') return githubCommits >= 50
          if (a.id === 'ach_10') return peersHelped >= 5
          return false
        }

        const newlyUnlocked: AchievementState[] = []
        set((state) => ({
          achievements: state.achievements.map((a) => {
            if (a.unlocked) return a
            if (isMet(a)) {
              const updated = { ...a, unlocked: true, unlockedAt: new Date().toISOString() }
              newlyUnlocked.push(updated)
              return updated
            }
            return a
          }),
        }))

        if (newlyUnlocked.length) {
          const bonus = newlyUnlocked.reduce((s, a) => s + a.xp, 0)
          useUserStore.getState().addXP(bonus)
          const push = useToastStore.getState().push
          newlyUnlocked.forEach((a) =>
            push({
              icon: a.icon,
              title: '¡Logro desbloqueado!',
              description: `${a.name} · +${a.xp} XP`,
            }),
          )
        }
        return newlyUnlocked
      },

      unlock: (id) =>
        set((state) => ({
          achievements: state.achievements.map((a) =>
            a.id === id && !a.unlocked
              ? { ...a, unlocked: true, unlockedAt: new Date().toISOString() }
              : a,
          ),
        })),

      resetAchievements: () => set({ achievements: initial }),
    }),
    {
      name: 'gamification-store',
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<GamificationState>
        return { ...current, ...p, achievements: mergeAchievements(p.achievements) }
      },
    },
  ),
)
