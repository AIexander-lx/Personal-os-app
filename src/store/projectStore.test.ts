import { describe, it, expect, beforeEach } from 'vitest'
import { migrateProject, useProjectStore } from './projectStore'

beforeEach(() => {
  localStorage.clear()
  useProjectStore.getState().resetProject()
})

const ids = (status: string) =>
  useProjectStore
    .getState()
    .items.filter((i) => i.status === status)
    .map((i) => i.id)

describe('projectStore', () => {
  it('las tareas nuevas entran al backlog', () => {
    useProjectStore.getState().addItem({ title: 'Login', kind: 'task', priority: 'alta', estimate: 3 })
    const added = useProjectStore.getState().items.at(-1)!
    expect(added.status).toBe('backlog')
    expect(added.estimate).toBe(3)
  })

  it('mover a otra columna la deja al final', () => {
    useProjectStore.getState().moveItem('f2', 'doing')
    useProjectStore.getState().moveItem('f1', 'doing')
    expect(ids('doing')).toEqual(['f2', 'f1'])
  })

  it('mover antes de otra tarea la ubica en esa posición', () => {
    const { moveItem } = useProjectStore.getState()
    moveItem('f1', 'done')
    moveItem('f2', 'done')
    moveItem('f3', 'done', 'f1')
    expect(ids('done')).toEqual(['f3', 'f1', 'f2'])
  })

  it('la etapa se queda dentro del rango', () => {
    useProjectStore.getState().setStage(99)
    expect(useProjectStore.getState().stage).toBe(4)
  })
})

describe('migrateProject', () => {
  it('convierte done → status y agrega prioridad', () => {
    const out = migrateProject(
      {
        phase: 'v0.6',
        items: [
          { id: 'a', title: 'A', kind: 'feature', done: true },
          { id: 'b', title: 'B', kind: 'bug', done: false },
        ],
        updates: [],
      },
      0,
    ) as { phase: string; items: { status: string; priority: string }[] }
    expect(out.phase).toBe('v0.6')
    expect(out.items.map((i) => i.status)).toEqual(['done', 'backlog'])
    expect(out.items.every((i) => i.priority === 'media')).toBe(true)
  })
})
