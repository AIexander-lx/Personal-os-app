import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { parseISO } from 'date-fns'
import type { DailyChecklistItem, DayCode } from '@/types'
import { dailyChecklistItems as seedItems, RETIRED_CHECKLIST_IDS, WELLNESS_HABITS } from '@/data/dailyChecklist'
import { dayCodeOf, DAILY_ITEM_XP, PERFECT_DAY_XP } from '@/utils'
import { useUserStore } from './userStore'
import { useToastStore } from './toastStore'

interface ChecklistState {
  items: DailyChecklistItem[]
  /** Fecha (yyyy-MM-dd) → ids de ítems completados ese día. */
  completions: Record<string, string[]>
  /** Fechas (yyyy-MM-dd) en las que ya se otorgó el bono de "día perfecto". */
  perfectDays: Record<string, boolean>

  addItem: (input: { label: string; icon: string; days?: DayCode[]; wellness?: boolean }) => void
  updateItem: (id: string, patch: Partial<Omit<DailyChecklistItem, 'id'>>) => void
  removeItem: (id: string) => void
  toggleCompletion: (date: string, itemId: string) => void
  resetItems: () => void
  resetAll: () => void
}

const initial = {
  items: seedItems,
  completions: {} as Record<string, string[]>,
  perfectDays: {} as Record<string, boolean>,
}

function applyXP(delta: number) {
  if (delta) useUserStore.getState().addXP(delta)
}

/** Ítems que aplican en una fecha dada (algunos solo ciertos días). */
export function applicableItems(items: DailyChecklistItem[], date: string): DailyChecklistItem[] {
  const code = dayCodeOf(parseISO(date))
  return items.filter((it) => !it.days || it.days.includes(code))
}

/** Migraciones del checklist guardado (ver `version` del persist). */
export function migrateChecklist(persisted: unknown, version: number) {
  const s = persisted as ChecklistState
  if (!s?.items) return s
  let items = s.items
  // v1: estudio, futsal y negocio pasaron a ser metas del mes (Metas de hoy).
  if (version < 1) items = items.filter((it) => !RETIRED_CHECKLIST_IDS.includes(it.id))
  // v2: hábitos de bienestar (pestaña Bienestar); el sueño pasa a ser uno de ellos.
  if (version < 2) {
    items = items.map((it) => (it.id === 'dc_sueno' ? { ...it, wellness: true } : it))
    const have = new Set(items.map((it) => it.id))
    items = [...items, ...WELLNESS_HABITS.filter((h) => !have.has(h.id))]
  }
  return { ...s, items }
}

export const useChecklistStore = create<ChecklistState>()(
  persist(
    (set, get) => ({
      ...initial,

      addItem: (input) =>
        set((s) => ({
          items: [
            ...s.items,
            {
              id: `dc_${Date.now()}`,
              label: input.label.trim() || 'Nuevo ítem',
              icon: input.icon || '✅',
              days: input.days,
              wellness: input.wellness,
            },
          ],
        })),

      updateItem: (id, patch) =>
        set((s) => ({ items: s.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) })),

      removeItem: (id) =>
        set((s) => ({
          items: s.items.filter((it) => it.id !== id),
          // Las marcas de ese ítem quedan huérfanas pero inofensivas; se limpian solas
          // la próxima vez que se evalúa el día (no cuentan para `applicableItems`).
        })),

      toggleCompletion: (date, itemId) => {
        set((s) => {
          const current = s.completions[date] ?? []
          const next = current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId]
          return { completions: { ...s.completions, [date]: next } }
        })

        const state = get()
        const itemDone = (state.completions[date] ?? []).includes(itemId)
        applyXP(itemDone ? DAILY_ITEM_XP : -DAILY_ITEM_XP)

        // Bono de "día perfecto": se otorga una vez al completar todo lo aplicable
        // ese día, y se revierte si se desmarca algo después.
        const applicable = applicableItems(state.items, date)
        const doneSet = new Set(state.completions[date] ?? [])
        const isPerfect = applicable.length > 0 && applicable.every((it) => doneSet.has(it.id))
        const hadBonus = state.perfectDays[date] ?? false

        if (isPerfect && !hadBonus) {
          set((s) => ({ perfectDays: { ...s.perfectDays, [date]: true } }))
          applyXP(PERFECT_DAY_XP)
          useToastStore.getState().push({
            icon: '✨',
            title: '¡Día perfecto!',
            description: `Completaste todo el checklist · +${PERFECT_DAY_XP} XP`,
          })
        } else if (!isPerfect && hadBonus) {
          set((s) => {
            const next = { ...s.perfectDays }
            delete next[date]
            return { perfectDays: next }
          })
          applyXP(-PERFECT_DAY_XP)
        }
      },

      resetItems: () => set({ items: seedItems }),

      resetAll: () => set(initial),
    }),
    {
      name: 'checklist-store',
      version: 2,
      migrate: migrateChecklist,
    },
  ),
)
