import raw from './plan-millonario.json'
import type { DayCode, Goal, Plan } from '@/types'

/**
 * Plan Millonario. Los datos viven en `plan-millonario.json` para poder
 * editarlos sin tocar componentes.
 */
export const plan = raw as unknown as Plan

export const goal90 = plan.goals.find((g) => g.horizon === '90d') as Goal
export const longTermGoals = plan.goals.filter((g) => g.horizon !== '90d')

/** Inicio del plan de 90 días = inicio de la fase 1. */
export const PLAN_START = plan.phases[0].start
/** Fin del plan = fin de la última fase. */
export const PLAN_END = plan.phases[plan.phases.length - 1].end

export const AREA_LABEL = {
  business: 'Negocio',
  trading: 'Trading',
  reading: 'Lectura',
} as const

/** Días de entrenamiento según los bloques de salud del horario semanal. */
export const TRAINING_DAYS = new Set<DayCode>(
  plan.weeklyBlocks.filter((b) => b.category === 'salud').map((b) => b.day),
)
