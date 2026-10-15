import { describe, it, expect, beforeEach } from 'vitest'
import { useUserStore } from './userStore'
import { migrateChecklist, useChecklistStore } from './checklistStore'
import { DAILY_ITEM_XP, PERFECT_DAY_XP } from '@/utils'

const xp = () => useUserStore.getState().user.totalXP
const MONDAY = '2026-10-12'
const TUESDAY = '2026-10-13'

beforeEach(() => {
  localStorage.clear()
  useUserStore.getState().resetAll()
  useChecklistStore.getState().resetAll()
})

/** Ids de la semilla (todos aplican cualquier día). */
const seedIds = () => useChecklistStore.getState().items.map((i) => i.id)

describe('checklistStore.toggleCompletion', () => {
  it('suma XP al marcar un ítem y lo resta al desmarcar', () => {
    useChecklistStore.getState().toggleCompletion(MONDAY, 'dc_sueno')
    expect(xp()).toBe(DAILY_ITEM_XP)
    useChecklistStore.getState().toggleCompletion(MONDAY, 'dc_sueno')
    expect(xp()).toBe(0)
  })

  it('completar todos los hábitos del día da el bono de día perfecto', () => {
    const ids = seedIds()
    ids.forEach((id) => useChecklistStore.getState().toggleCompletion(MONDAY, id))
    expect(xp()).toBe(ids.length * DAILY_ITEM_XP + PERFECT_DAY_XP)
  })

  it('un ítem de solo martes no hace falta el lunes, pero sí el martes', () => {
    const ids = seedIds()
    useChecklistStore.getState().addItem({ label: 'Estirar', icon: '🧘', days: ['TU'] })
    const tuesdayOnly = useChecklistStore.getState().items.at(-1)!.id
    const toggle = useChecklistStore.getState().toggleCompletion
    ids.forEach((id) => toggle(MONDAY, id))
    expect(xp()).toBe(ids.length * DAILY_ITEM_XP + PERFECT_DAY_XP)

    ids.forEach((id) => toggle(TUESDAY, id))
    // Falta el del martes: sin bono todavía.
    expect(xp()).toBe(2 * ids.length * DAILY_ITEM_XP + PERFECT_DAY_XP)
    toggle(TUESDAY, tuesdayOnly)
    expect(xp()).toBe((2 * ids.length + 1) * DAILY_ITEM_XP + 2 * PERFECT_DAY_XP)
  })

  it('desmarcar un ítem después del día perfecto revierte el bono', () => {
    const ids = seedIds()
    const toggle = useChecklistStore.getState().toggleCompletion
    ids.forEach((id) => toggle(MONDAY, id))
    toggle(MONDAY, ids[0]) // desmarca
    expect(xp()).toBe((ids.length - 1) * DAILY_ITEM_XP)
  })

  it('vuelve a otorgar el bono si se recompleta el día tras revertirlo', () => {
    const ids = seedIds()
    const toggle = useChecklistStore.getState().toggleCompletion
    ids.forEach((id) => toggle(MONDAY, id)) // día perfecto
    toggle(MONDAY, ids[0]) // desmarca: revierte bono
    toggle(MONDAY, ids[0]) // vuelve a marcar: día perfecto de nuevo
    expect(xp()).toBe(ids.length * DAILY_ITEM_XP + PERFECT_DAY_XP)
  })
})

describe('migrateChecklist', () => {
  it('v0 → v2: quita los ítems que ahora son metas y suma los hábitos de bienestar', () => {
    const out = migrateChecklist(
      {
        items: [
          { id: 'dc_estudio', label: 'Estudiar', icon: '📚' },
          { id: 'dc_sueno', label: 'Dormir', icon: '😴' },
          { id: 'mio', label: 'Meditar', icon: '🧘' },
        ],
        completions: {},
        perfectDays: {},
      },
      0,
    ) as { items: { id: string; wellness?: boolean }[] }
    const ids = out.items.map((i) => i.id)
    expect(ids).not.toContain('dc_estudio')
    expect(ids).toContain('mio')
    expect(ids).toContain('dc_agua')
    expect(out.items.find((i) => i.id === 'dc_sueno')!.wellness).toBe(true)
  })

  it('no duplica un hábito que ya existía', () => {
    const out = migrateChecklist({ items: [{ id: 'dc_agua', label: 'Agua', icon: '💧' }] }, 1) as {
      items: { id: string }[]
    }
    expect(out.items.filter((i) => i.id === 'dc_agua')).toHaveLength(1)
  })
})

describe('checklistStore CRUD de ítems', () => {
  it('agrega, actualiza y elimina ítems', () => {
    const before = useChecklistStore.getState().items.length
    useChecklistStore.getState().addItem({ label: 'Meditar', icon: '🧘' })
    const items = useChecklistStore.getState().items
    expect(items).toHaveLength(before + 1)

    const added = items.at(-1)!
    useChecklistStore.getState().updateItem(added.id, { label: 'Meditar 10 min' })
    expect(useChecklistStore.getState().items.find((i) => i.id === added.id)!.label).toBe('Meditar 10 min')

    useChecklistStore.getState().removeItem(added.id)
    expect(useChecklistStore.getState().items).toHaveLength(before)
  })
})
