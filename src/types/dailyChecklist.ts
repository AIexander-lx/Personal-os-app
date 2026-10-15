import type { DayCode } from './plan'

/** Plantilla de un ítem del checklist diario (no su estado de completado). */
export interface DailyChecklistItem {
  id: string
  label: string
  icon: string
  /** Si está definido, el ítem solo aplica esos días (ej. futsal = mar/sáb). Sin definir = todos los días. */
  days?: DayCode[]
  /** Hábito de bienestar: también se muestra en la pestaña Bienestar. */
  wellness?: boolean
}
