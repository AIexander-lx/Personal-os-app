import { describe, it, expect, beforeEach } from 'vitest'
import { useUserStore } from './userStore'
import { useGamificationStore, mergeAchievements } from './gamificationStore'
import { usePlanStore } from './planStore'
import { goal90 } from '@/data/plan'
import { checklistXP, PHASE_TASK_XP, REVIEW_XP, weekStartKey } from '@/utils'
import { addWeeks } from 'date-fns'

beforeEach(() => {
  localStorage.clear()
  useUserStore.getState().resetAll()
  useGamificationStore.getState().resetAchievements()
  usePlanStore.getState().resetPlan()
})

const xp = () => useUserStore.getState().user.totalXP

describe('planStore', () => {
  it('marcar un ítem suma XP y desmarcarlo lo resta (sin farmear)', () => {
    usePlanStore.getState().toggleChecklist('g90-1')
    expect(xp()).toBe(checklistXP('g90-1'))
    usePlanStore.getState().toggleChecklist('g90-1')
    expect(xp()).toBe(0)
    usePlanStore.getState().toggleChecklist('g90-1')
    expect(xp()).toBe(checklistXP('g90-1'))
  })

  it('tareas de fase dan XP', () => {
    usePlanStore.getState().togglePhaseTask('1:business:0')
    expect(xp()).toBe(PHASE_TASK_XP)
    expect(usePlanStore.getState().phaseTasks['1:business:0']).toBe(true)
  })

  it('la revisión semanal da XP solo la primera vez por semana', () => {
    const save = usePlanStore.getState().saveReview
    const thisWeek = weekStartKey(new Date())
    save(thisWeek, { horas_negocio: 10 })
    save(thisWeek, { horas_negocio: 12 }, 'ajuste')
    const { reviews } = usePlanStore.getState()
    expect(reviews).toHaveLength(1)
    expect(reviews[0].values.horas_negocio).toBe(12)
    expect(reviews[0].note).toBe('ajuste')
    expect(xp()).toBe(REVIEW_XP)
  })

  it('la semana anterior da XP, pero semanas más viejas solo quedan en el historial', () => {
    const save = usePlanStore.getState().saveReview
    save(weekStartKey(addWeeks(new Date(), -1)), {})
    expect(xp()).toBe(REVIEW_XP)
    save(weekStartKey(addWeeks(new Date(), -3)), {})
    expect(xp()).toBe(REVIEW_XP)
    expect(usePlanStore.getState().reviews).toHaveLength(2)
  })

  it('las revisiones quedan ordenadas por semana', () => {
    const save = usePlanStore.getState().saveReview
    save('2026-11-02', {})
    save('2026-10-19', {})
    expect(usePlanStore.getState().reviews.map((r) => r.weekStart)).toEqual(['2026-10-19', '2026-11-02'])
  })
})

describe('logros del plan', () => {
  const unlocked = (id: string) =>
    useGamificationStore.getState().achievements.find((a) => a.id === id)!.unlocked

  it('Primer Cliente se desbloquea con g90-5', () => {
    usePlanStore.getState().toggleChecklist('g90-5')
    useGamificationStore.getState().evaluate()
    expect(unlocked('ach_13')).toBe(true)
    expect(unlocked('ach_14')).toBe(false)
  })

  it('desmarcar el primer cliente revierte el logro y su XP', () => {
    usePlanStore.getState().toggleChecklist('g90-5')
    useGamificationStore.getState().evaluate()
    expect(unlocked('ach_13')).toBe(true)
    expect(xp()).toBe(checklistXP('g90-5') + 500)

    usePlanStore.getState().toggleChecklist('g90-5')
    useGamificationStore.getState().evaluate()
    expect(unlocked('ach_13')).toBe(false)
    expect(xp()).toBe(0)

    // Volver a marcarlo lo desbloquea otra vez, sin acumular de más.
    usePlanStore.getState().toggleChecklist('g90-5')
    useGamificationStore.getState().evaluate()
    expect(xp()).toBe(checklistXP('g90-5') + 500)
  })

  it('los logros de revisión no se revierten', () => {
    usePlanStore.getState().saveReview(weekStartKey(new Date()), {})
    useGamificationStore.getState().evaluate()
    useGamificationStore.getState().evaluate()
    expect(unlocked('ach_15')).toBe(true)
  })

  it('Plan 90 Días requiere todo el checklist', () => {
    goal90.checklist!.forEach((c) => usePlanStore.getState().toggleChecklist(c.id))
    useGamificationStore.getState().evaluate()
    expect(unlocked('ach_14')).toBe(true)
  })

  it('Primera Revisión y Constancia', () => {
    const save = usePlanStore.getState().saveReview
    save('2026-10-19', {})
    useGamificationStore.getState().evaluate()
    expect(unlocked('ach_15')).toBe(true)
    expect(unlocked('ach_16')).toBe(false)
    ;['2026-10-26', '2026-11-02', '2026-11-09'].forEach((w) => save(w, {}))
    useGamificationStore.getState().evaluate()
    expect(unlocked('ach_16')).toBe(true)
  })

  it('mergeAchievements agrega logros nuevos y conserva los desbloqueados', () => {
    const merged = mergeAchievements([
      { id: 'ach_1', name: 'viejo', description: '', icon: '', xp: 1, unlocked: true, unlockedAt: 'x' },
    ])
    expect(merged.find((a) => a.id === 'ach_1')!.unlocked).toBe(true)
    expect(merged.find((a) => a.id === 'ach_1')!.name).toBe('First Session')
    expect(merged.some((a) => a.id === 'ach_13')).toBe(true)
  })
})
