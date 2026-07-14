import { create } from 'zustand'

export interface Toast {
  id: string
  title: string
  description: string
  icon: string
}

interface ToastState {
  toasts: Toast[]
  push: (t: Omit<Toast, 'id'>) => void
  dismiss: (id: string) => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (t) =>
    set((s) => ({ toasts: [...s.toasts, { ...t, id: `toast_${Date.now()}_${Math.random()}` }] })),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
