import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WeeklyReview } from '@/types'
import { goal90 } from '@/data/plan'
import { checklistXP, PHASE_TASK_XP, REVIEW_XP } from '@/utils'
import { useUserStore } from './userStore'
import { useToastStore } from './toastStore'

interface PlanState {
  /** Ítems del checklist de 90 días marcados (id → true). */
  checklist: Record<string, boolean>
  /** Tareas del temario marcadas (clave `fase:área:índice`). */
  phaseTasks: Record<string, boolean>
  /** Revisiones semanales, una por semana (lunes). */
  reviews: WeeklyReview[]

  toggleChecklist: (id: string) => void
  togglePhaseTask: (key: string) => void
  /** Crea o actualiza la revisión de la semana. Da XP solo la primera vez. */
  saveReview: (weekStart: string, values: Record<string, number | null>, note?: string) => void
  resetPlan: () => void
}

const initial = { checklist: {}, phaseTasks: {}, reviews: [] as WeeklyReview[] }

/**
 * Marcar suma XP y desmarcar la resta: así marcar/desmarcar nunca acumula
 * puntos de más.
 */
function applyXP(delta: number) {
  if (delta) useUserStore.getState().addXP(delta)
}

export const usePlanStore = create<PlanState>()(
  persist(
    (set, get) => ({
      ...initial,

      toggleChecklist: (id) => {
        const done = !get().checklist[id]
        set((s) => ({ checklist: { ...s.checklist, [id]: done } }))
        const xp = checklistXP(id)
        applyXP(done ? xp : -xp)
        if (done) {
          const item = goal90.checklist?.find((c) => c.id === id)
          useToastStore.getState().push({
            icon: id === 'g90-5' ? '💰' : '✅',
            title: 'Meta de 90 días',
            description: `${item?.text ?? 'Ítem completado'} · +${xp} XP`,
          })
        }
      },

      togglePhaseTask: (key) => {
        const done = !get().phaseTasks[key]
        set((s) => ({ phaseTasks: { ...s.phaseTasks, [key]: done } }))
        applyXP(done ? PHASE_TASK_XP : -PHASE_TASK_XP)
      },

      saveReview: (weekStart, values, note) => {
        const exists = get().reviews.some((r) => r.weekStart === weekStart)
        const review: WeeklyReview = {
          weekStart,
          values,
          note: note?.trim() || undefined,
          savedAt: new Date().toISOString(),
        }
        set((s) => ({
          reviews: [...s.reviews.filter((r) => r.weekStart !== weekStart), review].sort((a, b) =>
            a.weekStart.localeCompare(b.weekStart),
          ),
        }))
        if (!exists) {
          applyXP(REVIEW_XP)
          useToastStore.getState().push({
            icon: '🧭',
            title: 'Revisión semanal guardada',
            description: `+${REVIEW_XP} XP`,
          })
        } else {
          useToastStore.getState().push({ icon: '💾', title: 'Revisión actualizada', description: 'Semana del ' + weekStart })
        }
      },

      resetPlan: () => set(initial),
    }),
    { name: 'plan-store', version: 1 },
  ),
)
