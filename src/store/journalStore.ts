import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Trade, TradeInput } from '@/types'
import { demoClosedCount, JOURNAL_GOAL, TRADE_XP } from '@/utils'
import { useUserStore } from './userStore'
import { usePlanStore } from './planStore'

/** Ítem del checklist de 90 días que se completa con el diario. */
export const JOURNAL_CHECKLIST_ID = 'g90-6'

interface JournalState {
  trades: Trade[]
  addTrade: (input: TradeInput) => Trade
  updateTrade: (id: string, patch: Partial<TradeInput>) => void
  removeTrade: (id: string) => void
  resetJournal: () => void
}

const sortDesc = (trades: Trade[]) => [...trades].sort((a, b) => b.date.localeCompare(a.date))

/**
 * Mantiene el ítem "30 operaciones en demo registradas en el diario" en línea
 * con el diario: se marca al llegar a la meta y se desmarca si se baja de ella.
 */
function syncChecklist(trades: Trade[]) {
  const plan = usePlanStore.getState()
  const reached = demoClosedCount(trades) >= JOURNAL_GOAL
  if (reached !== !!plan.checklist[JOURNAL_CHECKLIST_ID]) plan.toggleChecklist(JOURNAL_CHECKLIST_ID)
}

export const useJournalStore = create<JournalState>()(
  persist(
    (set, get) => ({
      trades: [],

      addTrade: (input) => {
        const trade: Trade = {
          ...input,
          pair: input.pair.trim().toUpperCase(),
          reason: input.reason.trim(),
          lesson: input.lesson?.trim() || undefined,
          id: `trade_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ trades: sortDesc([trade, ...s.trades]) }))
        useUserStore.getState().addXP(TRADE_XP)
        syncChecklist(get().trades)
        return trade
      },

      updateTrade: (id, patch) => {
        set((s) => ({
          trades: sortDesc(
            s.trades.map((t) =>
              t.id === id
                ? {
                    ...t,
                    ...patch,
                    pair: (patch.pair ?? t.pair).trim().toUpperCase(),
                    lesson: (patch.lesson ?? t.lesson)?.trim() || undefined,
                  }
                : t,
            ),
          ),
        }))
        syncChecklist(get().trades)
      },

      removeTrade: (id) => {
        if (!get().trades.some((t) => t.id === id)) return
        set((s) => ({ trades: s.trades.filter((t) => t.id !== id) }))
        useUserStore.getState().addXP(-TRADE_XP)
        syncChecklist(get().trades)
      },

      resetJournal: () => set({ trades: [] }),
    }),
    { name: 'journal-store', version: 1 },
  ),
)
