import type { DailyChecklistItem } from '@/types'

/** Hábitos de bienestar que se sumaron en la v2 del checklist (pestaña Bienestar). */
export const WELLNESS_HABITS: DailyChecklistItem[] = [
  { id: 'dc_agua', label: 'Hidratación (2 L de agua)', icon: '💧', wellness: true },
  { id: 'dc_comida', label: 'Comer saludable', icon: '🥗', wellness: true },
  { id: 'dc_pantallas', label: 'Sin pantallas 30 min antes de dormir', icon: '📵', wellness: true },
  { id: 'dc_estirar', label: 'Movilidad / estiramientos', icon: '🧘', wellness: true },
]

/**
 * Hábitos diarios por defecto. Estudio, futsal, lectura e ingresos no van
 * aquí: son metas del mes y salen solas en "Metas de hoy".
 * Editable desde el propio componente; esto es solo la semilla inicial.
 */
export const dailyChecklistItems: DailyChecklistItem[] = [
  { id: 'dc_sueno', label: 'Dormir ≥ 6.5h', icon: '😴', wellness: true },
  { id: 'dc_trading', label: 'Registrar operación en el diario', icon: '📈' },
  ...WELLNESS_HABITS,
]

/** Ítems de versiones anteriores que ahora son metas del mes (se quitan al migrar). */
export const RETIRED_CHECKLIST_IDS = ['dc_estudio', 'dc_futsal', 'dc_negocio']
