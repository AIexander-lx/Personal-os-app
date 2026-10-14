import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { daySchedule as seed, type TimeBlock } from '@/data/schedule'

interface ScheduleState {
  blocks: TimeBlock[]
  addBlock: (block: Omit<TimeBlock, 'id'>) => void
  updateBlock: (id: string, patch: Partial<Omit<TimeBlock, 'id'>>) => void
  removeBlock: (id: string) => void
  resetSchedule: () => void
}

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set) => ({
      blocks: seed,

      addBlock: (block) =>
        set((s) => ({
          blocks: [...s.blocks, { ...block, id: `block_${Date.now()}` }],
        })),

      updateBlock: (id, patch) =>
        set((s) => ({
          blocks: s.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        })),

      removeBlock: (id) => set((s) => ({ blocks: s.blocks.filter((b) => b.id !== id) })),

      resetSchedule: () => set({ blocks: seed }),
    }),
    {
      name: 'schedule-store',
      // v1: el horario pasa a ser semanal (bloques por día del Plan Millonario).
      // v2: los bloques de trading enlazan al diario (sin tocar el resto).
      version: 2,
      migrate: (persisted, version) => {
        if (version < 1) return { blocks: seed }
        const state = persisted as { blocks: TimeBlock[] }
        return {
          ...state,
          blocks: state.blocks.map((b) => (b.icon === '📈' && b.to === '/plan' ? { ...b, to: '/journal' } : b)),
        }
      },
    },
  ),
)
