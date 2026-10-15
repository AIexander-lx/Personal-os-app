import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { todayKey } from '@/utils'

/** Tracker del proyecto principal (StreakStudy): tareas en kanban, etapa y avances. */
export type ItemKind = 'feature' | 'bug' | 'task'
export type ItemStatus = 'backlog' | 'doing' | 'done'
export type Priority = 'alta' | 'media' | 'baja'

export interface TrackerItem {
  id: string
  title: string
  kind: ItemKind
  status: ItemStatus
  priority: Priority
  /** Horas estimadas (opcional). */
  estimate?: number
}

export interface UpdateEntry {
  id: string
  date: string
  text: string
}

/** Etapas del proyecto, en orden (timeline). */
export const PROJECT_STAGES = ['Plan', 'Diseño', 'Desarrollo', 'Testing', 'Deploy'] as const

export type NewItem = Pick<TrackerItem, 'title' | 'kind' | 'priority'> & { estimate?: number }

interface ProjectState {
  /** Versión (v0.5, v0.6, beta, v1.0). */
  phase: string
  /** Índice en PROJECT_STAGES. */
  stage: number
  items: TrackerItem[]
  updates: UpdateEntry[]
  addItem: (input: NewItem) => void
  updateItem: (id: string, patch: Partial<Omit<TrackerItem, 'id'>>) => void
  /** Mueve una tarea a una columna; si se da `beforeId`, queda justo antes de esa tarea. */
  moveItem: (id: string, status: ItemStatus, beforeId?: string) => void
  removeItem: (id: string) => void
  setPhase: (phase: string) => void
  setStage: (stage: number) => void
  addUpdate: (text: string) => void
  resetProject: () => void
}

const seedItems: TrackerItem[] = [
  { id: 'f1', title: 'Algoritmo SM-2 de repaso espaciado', kind: 'feature', status: 'backlog', priority: 'alta', estimate: 6 },
  { id: 'f2', title: 'Notificaciones channel-agnostic', kind: 'feature', status: 'backlog', priority: 'media', estimate: 5 },
  { id: 'f3', title: 'App móvil con Expo', kind: 'feature', status: 'backlog', priority: 'media', estimate: 10 },
  { id: 'f4', title: '2 sensores del celular (curso)', kind: 'feature', status: 'backlog', priority: 'alta', estimate: 4 },
  { id: 'f5', title: 'Dashboard de estadísticas de estudio', kind: 'feature', status: 'backlog', priority: 'baja', estimate: 4 },
  { id: 'b1', title: 'Racha se reinicia al cambiar de zona horaria', kind: 'bug', status: 'backlog', priority: 'alta', estimate: 2 },
  { id: 'b2', title: 'Notificación duplicada en Android', kind: 'bug', status: 'backlog', priority: 'media', estimate: 2 },
]

const initial = {
  phase: 'v0.5',
  stage: 2,
  items: seedItems,
  updates: [] as UpdateEntry[],
}

/** v0 guardaba `done: boolean` y solo features/bugs. */
interface LegacyItem {
  id: string
  title: string
  kind: 'feature' | 'bug'
  done: boolean
}

export function migrateProject(persisted: unknown, version: number) {
  const s = persisted as Record<string, unknown>
  if (version < 1 && Array.isArray(s?.items)) {
    return {
      ...s,
      stage: initial.stage,
      items: (s.items as LegacyItem[]).map(
        (i): TrackerItem => ({
          id: i.id,
          title: i.title,
          kind: i.kind,
          status: i.done ? 'done' : 'backlog',
          priority: 'media',
        }),
      ),
    }
  }
  return s
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      ...initial,

      addItem: (input) =>
        set((s) => ({
          items: [
            ...s.items,
            {
              id: `${input.kind}_${Date.now()}`,
              title: input.title.trim() || 'Nueva tarea',
              kind: input.kind,
              priority: input.priority,
              estimate: input.estimate && input.estimate > 0 ? input.estimate : undefined,
              status: 'backlog',
            },
          ],
        })),

      updateItem: (id, patch) =>
        set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) })),

      moveItem: (id, status, beforeId) =>
        set((s) => {
          const item = s.items.find((i) => i.id === id)
          if (!item || id === beforeId) return s
          const rest = s.items.filter((i) => i.id !== id)
          const moved = { ...item, status }
          const at = beforeId ? rest.findIndex((i) => i.id === beforeId) : -1
          if (at === -1) return { items: [...rest, moved] }
          return { items: [...rest.slice(0, at), moved, ...rest.slice(at)] }
        }),

      removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      setPhase: (phase) => set({ phase }),
      setStage: (stage) => set({ stage: Math.max(0, Math.min(PROJECT_STAGES.length - 1, stage)) }),
      addUpdate: (text) =>
        set((s) => ({
          updates: [{ id: `u_${Date.now()}`, date: todayKey(), text }, ...s.updates],
        })),
      resetProject: () => set(initial),
    }),
    { name: 'project-store', version: 1, migrate: migrateProject },
  ),
)
