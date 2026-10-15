import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Evaluation, IncomeEntry, IncomeGoal } from '@/types'
import { monthKey } from '@/utils'

interface GoalsState {
  /** Nota mínima para aprobar un curso (escala 0-20). */
  passingGrade: number
  /** Evaluaciones por curso (id del curso → evaluaciones). */
  evaluations: Record<string, Evaluation[]>
  /** Meta de páginas por día; la del mes es esto × días del mes. */
  pagesPerDay: number
  /** Páginas leídas por fecha (yyyy-MM-dd). */
  readingLog: Record<string, number>
  incomeGoal: IncomeGoal
  income: IncomeEntry[]
  /** Días (yyyy-MM-dd) en que se cumplió la sesión de estudio del día. */
  studyDays: Record<string, boolean>

  setPassingGrade: (n: number) => void
  addEvaluation: (courseId: string, input: Omit<Evaluation, 'id'>) => void
  updateEvaluation: (courseId: string, id: string, patch: Partial<Omit<Evaluation, 'id'>>) => void
  removeEvaluation: (courseId: string, id: string) => void
  setPagesPerDay: (n: number) => void
  logPages: (date: string, pages: number) => void
  setIncomeGoal: (patch: Partial<IncomeGoal>) => void
  addIncome: (input: Omit<IncomeEntry, 'id'>) => void
  removeIncome: (id: string) => void
  toggleStudyDay: (date: string) => void
  resetGoals: () => void
}

const initial = {
  passingGrade: 11,
  evaluations: {} as Record<string, Evaluation[]>,
  pagesPerDay: 7,
  readingLog: {} as Record<string, number>,
  incomeGoal: { startMonth: monthKey(new Date()), base: 100, step: 50, currency: 'USD' } as IncomeGoal,
  income: [] as IncomeEntry[],
  studyDays: {} as Record<string, boolean>,
}

const clampGrade = (g: number | null) => (g == null ? null : Math.max(0, Math.min(20, g)))
const clampWeight = (w: number) => Math.max(0, Math.min(100, w))

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set) => ({
      ...initial,

      setPassingGrade: (n) => set({ passingGrade: Math.max(0, Math.min(20, n)) }),

      addEvaluation: (courseId, input) =>
        set((s) => ({
          evaluations: {
            ...s.evaluations,
            [courseId]: [
              ...(s.evaluations[courseId] ?? []),
              {
                id: `ev_${Date.now()}`,
                name: input.name.trim() || 'Evaluación',
                weight: clampWeight(input.weight),
                grade: clampGrade(input.grade),
              },
            ],
          },
        })),

      updateEvaluation: (courseId, id, patch) =>
        set((s) => ({
          evaluations: {
            ...s.evaluations,
            [courseId]: (s.evaluations[courseId] ?? []).map((e) => {
              if (e.id !== id) return e
              const merged = { ...e, ...patch }
              return { ...merged, weight: clampWeight(merged.weight), grade: clampGrade(merged.grade) }
            }),
          },
        })),

      removeEvaluation: (courseId, id) =>
        set((s) => ({
          evaluations: {
            ...s.evaluations,
            [courseId]: (s.evaluations[courseId] ?? []).filter((e) => e.id !== id),
          },
        })),

      setPagesPerDay: (n) => set({ pagesPerDay: Math.max(0, Math.round(n)) }),

      logPages: (date, pages) =>
        set((s) => {
          const log = { ...s.readingLog }
          const n = Math.max(0, Math.round(pages))
          if (n) log[date] = n
          else delete log[date]
          return { readingLog: log }
        }),

      setIncomeGoal: (patch) => set((s) => ({ incomeGoal: { ...s.incomeGoal, ...patch } })),

      addIncome: (input) =>
        set((s) => ({
          income: [
            ...s.income,
            { id: `in_${Date.now()}`, date: input.date, amount: input.amount, note: input.note?.trim() || undefined },
          ].sort((a, b) => a.date.localeCompare(b.date)),
        })),

      removeIncome: (id) => set((s) => ({ income: s.income.filter((e) => e.id !== id) })),

      toggleStudyDay: (date) =>
        set((s) => {
          const days = { ...s.studyDays }
          if (days[date]) delete days[date]
          else days[date] = true
          return { studyDays: days }
        }),

      resetGoals: () => set({ ...initial, incomeGoal: { ...initial.incomeGoal, startMonth: monthKey(new Date()) } }),
    }),
    { name: 'goals-store', version: 1 },
  ),
)
