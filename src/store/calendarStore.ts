import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CalendarView = 'week' | 'month' | 'agenda'

interface CalendarState {
  /** Calendario de Google seleccionado para mostrar en Horario. 'primary' = el principal. */
  calendarId: string
  setCalendarId: (id: string) => void
  /** Vista preferida de la Agenda: grilla semanal, mensual o lista. */
  view: CalendarView
  setView: (view: CalendarView) => void
}

/** Preferencia de UI (como el tema): no se incluye en el backup de datos. */
export const useCalendarStore = create<CalendarState>()(
  persist(
    (set) => ({
      calendarId: 'primary',
      setCalendarId: (id) => set({ calendarId: id }),
      view: 'week',
      setView: (view) => set({ view }),
    }),
    { name: 'calendar-store' },
  ),
)
