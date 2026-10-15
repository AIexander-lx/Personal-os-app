import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Expense, Investment } from '@/types'

interface FinanceState {
  expenses: Expense[]
  investments: Investment[]
  addExpense: (input: Omit<Expense, 'id'>) => void
  removeExpense: (id: string) => void
  addInvestment: (input: Omit<Investment, 'id'>) => void
  removeInvestment: (id: string) => void
  resetFinance: () => void
}

const byDate = <T extends { date: string }>(a: T, b: T) => a.date.localeCompare(b.date)
const cleanNote = (note?: string) => note?.trim() || undefined

/** Gastos y aportes a inversión. Los ingresos viven en goalsStore (meta progresiva). */
export const useFinanceStore = create<FinanceState>()(
  persist(
    (set) => ({
      expenses: [],
      investments: [],

      addExpense: (input) =>
        set((s) => ({
          expenses: [...s.expenses, { ...input, id: `ex_${Date.now()}`, note: cleanNote(input.note) }].sort(byDate),
        })),
      removeExpense: (id) => set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),

      addInvestment: (input) =>
        set((s) => ({
          investments: [...s.investments, { ...input, id: `iv_${Date.now()}`, note: cleanNote(input.note) }].sort(byDate),
        })),
      removeInvestment: (id) => set((s) => ({ investments: s.investments.filter((e) => e.id !== id) })),

      resetFinance: () => set({ expenses: [], investments: [] }),
    }),
    { name: 'finance-store', version: 1 },
  ),
)
