import { describe, it, expect, beforeEach } from 'vitest'
import { useUserStore } from './userStore'
import { usePlanStore } from './planStore'
import { useJournalStore, JOURNAL_CHECKLIST_ID } from './journalStore'
import { checklistXP, JOURNAL_GOAL, TRADE_XP } from '@/utils'
import type { TradeInput } from '@/types'

const input = (over: Partial<TradeInput> = {}): TradeInput => ({
  date: '2026-10-20T09:00',
  pair: ' eurusd ',
  direction: 'long',
  account: 'demo',
  entry: 1.1,
  stopLoss: 1.095,
  exit: 1.11,
  pnlUsd: null,
  followedRules: true,
  reason: 'Rebote en soporte',
  ...over,
})

const xp = () => useUserStore.getState().user.totalXP

beforeEach(() => {
  localStorage.clear()
  useUserStore.getState().resetAll()
  usePlanStore.getState().resetPlan()
  useJournalStore.getState().resetJournal()
})

describe('journalStore', () => {
  it('registrar suma XP y normaliza el par; borrar lo resta', () => {
    const t = useJournalStore.getState().addTrade(input())
    expect(t.pair).toBe('EURUSD')
    expect(xp()).toBe(TRADE_XP)
    useJournalStore.getState().removeTrade(t.id)
    expect(useJournalStore.getState().trades).toHaveLength(0)
    expect(xp()).toBe(0)
  })

  it('ordena de la más reciente a la más antigua', () => {
    const add = useJournalStore.getState().addTrade
    add(input({ date: '2026-10-20T09:00' }))
    add(input({ date: '2026-10-22T09:00' }))
    add(input({ date: '2026-10-21T09:00' }))
    expect(useJournalStore.getState().trades.map((t) => t.date.slice(8, 10))).toEqual(['22', '21', '20'])
  })

  it('cerrar una operación abierta con updateTrade', () => {
    const t = useJournalStore.getState().addTrade(input({ exit: null }))
    useJournalStore.getState().updateTrade(t.id, { exit: 1.105, lesson: ' salí antes ' })
    const saved = useJournalStore.getState().trades[0]
    expect(saved.exit).toBe(1.105)
    expect(saved.lesson).toBe('salí antes')
  })

  it(`marca el ítem del checklist al llegar a ${JOURNAL_GOAL} demo cerradas y lo desmarca si se baja`, () => {
    const add = useJournalStore.getState().addTrade
    for (let i = 0; i < JOURNAL_GOAL - 1; i++) add(input())
    add(input({ account: 'real' })) // no cuenta
    add(input({ exit: null })) // abierta, no cuenta
    expect(usePlanStore.getState().checklist[JOURNAL_CHECKLIST_ID]).toBeFalsy()

    const last = add(input())
    expect(usePlanStore.getState().checklist[JOURNAL_CHECKLIST_ID]).toBe(true)
    expect(xp()).toBe((JOURNAL_GOAL + 2) * TRADE_XP + checklistXP(JOURNAL_CHECKLIST_ID))

    useJournalStore.getState().removeTrade(last.id)
    expect(usePlanStore.getState().checklist[JOURNAL_CHECKLIST_ID]).toBe(false)
  })
})
