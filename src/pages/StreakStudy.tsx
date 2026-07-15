import { useState } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { clsx } from 'clsx'
import { Card, ProgressBar } from '@/components/common'
import { formatDate, todayKey } from '@/utils'

type ItemKind = 'feature' | 'bug'

interface TrackerItem {
  id: string
  title: string
  kind: ItemKind
  done: boolean
}

interface UpdateEntry {
  id: string
  date: string
  text: string
}

interface ProjectState {
  phase: string
  items: TrackerItem[]
  updates: UpdateEntry[]
  addItem: (title: string, kind: ItemKind) => void
  toggleItem: (id: string) => void
  removeItem: (id: string) => void
  reorder: (kind: ItemKind, from: number, to: number) => void
  setPhase: (phase: string) => void
  addUpdate: (text: string) => void
}

const seedItems: TrackerItem[] = [
  { id: 'f1', title: 'Algoritmo SM-2 de repaso espaciado', kind: 'feature', done: false },
  { id: 'f2', title: 'Notificaciones channel-agnostic', kind: 'feature', done: false },
  { id: 'f3', title: 'App móvil con Expo', kind: 'feature', done: false },
  { id: 'f4', title: '2 sensores del celular (curso)', kind: 'feature', done: false },
  { id: 'f5', title: 'Dashboard de estadísticas de estudio', kind: 'feature', done: false },
  { id: 'b1', title: 'Racha se reinicia al cambiar de zona horaria', kind: 'bug', done: false },
  { id: 'b2', title: 'Notificación duplicada en Android', kind: 'bug', done: false },
]

const seedUpdates: UpdateEntry[] = []

const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      phase: 'v0.5',
      items: seedItems,
      updates: seedUpdates,
      addItem: (title, kind) =>
        set((s) => ({
          items: [...s.items, { id: `${kind}_${Date.now()}`, title, kind, done: false }],
        })),
      toggleItem: (id) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)),
        })),
      removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      reorder: (kind, from, to) =>
        set((s) => {
          const group = s.items.filter((i) => i.kind === kind)
          const others = s.items.filter((i) => i.kind !== kind)
          const [moved] = group.splice(from, 1)
          group.splice(to, 0, moved)
          return { items: [...others, ...group] }
        }),
      setPhase: (phase) => set({ phase }),
      addUpdate: (text) =>
        set((s) => ({
          updates: [{ id: `u_${Date.now()}`, date: todayKey(), text }, ...s.updates],
        })),
    }),
    { name: 'project-store' },
  ),
)

const STACK = ['React', 'TypeScript', 'Expo', 'Node.js', 'PostgreSQL', 'AWS', 'Docker', 'SM-2']

function TrackerColumn({ kind }: { kind: ItemKind }) {
  const items = useProjectStore((s) => s.items.filter((i) => i.kind === kind))
  const toggleItem = useProjectStore((s) => s.toggleItem)
  const removeItem = useProjectStore((s) => s.removeItem)
  const addItem = useProjectStore((s) => s.addItem)
  const reorder = useProjectStore((s) => s.reorder)
  const [draft, setDraft] = useState('')
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const title = kind === 'feature' ? '✨ Features' : '🐛 Bugs'

  return (
    <Card title={title} subtitle={`${items.filter((i) => i.done).length}/${items.length} resueltos`}>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div
            key={item.id}
            draggable
            onDragStart={() => setDragIndex(idx)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragIndex !== null && dragIndex !== idx) reorder(kind, dragIndex, idx)
              setDragIndex(null)
            }}
            className={clsx(
              'group flex items-center gap-2 rounded-lg border border-surface-border/40 bg-elevated/40 p-2.5 transition-colors',
              dragIndex === idx && 'opacity-50',
            )}
          >
            <span className="cursor-grab text-muted-2 active:cursor-grabbing">⠿</span>
            <input
              type="checkbox"
              checked={item.done}
              onChange={() => toggleItem(item.id)}
              className="h-4 w-4 accent-cyan-400"
            />
            <span className={clsx('flex-1 text-sm', item.done ? 'text-muted-2 line-through' : 'text-fg')}>
              {item.title}
            </span>
            <button
              onClick={() => removeItem(item.id)}
              className="text-muted-2 opacity-0 transition-opacity hover:text-rose-600 dark:hover:text-rose-400 group-hover:opacity-100"
              aria-label="Eliminar"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (draft.trim()) {
            addItem(draft.trim(), kind)
            setDraft('')
          }
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={kind === 'feature' ? 'Nueva feature…' : 'Nuevo bug…'}
          className="flex-1 rounded-lg border border-surface-border/60 bg-input/60 px-3 py-1.5 text-sm text-fg placeholder:text-muted-2 focus:border-accent focus:outline-none"
        />
        <button className="rounded-lg bg-accent/15 px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent/25">
          +
        </button>
      </form>
    </Card>
  )
}

export default function StreakStudy() {
  const phase = useProjectStore((s) => s.phase)
  const setPhase = useProjectStore((s) => s.setPhase)
  const items = useProjectStore((s) => s.items)
  const updates = useProjectStore((s) => s.updates)
  const addUpdate = useProjectStore((s) => s.addUpdate)
  const [updateDraft, setUpdateDraft] = useState('')

  const completion = items.length
    ? Math.round((items.filter((i) => i.done).length / items.length) * 100)
    : 0

  return (
    <div className="space-y-6">
      <header className="animate-fade-in">
        <h1 className="text-2xl font-bold text-fg sm:text-3xl">🚀 StreakStudy</h1>
        <p className="text-sm text-muted">Proyecto principal · tracker de features y bugs</p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="Sobre el proyecto" icon="📌">
          <p className="text-sm text-fg-soft">
            App de estudio con repaso espaciado (SM-2) y notificaciones channel-agnostic.
            Objetivo del roadmap: v1.0 con monetización.
          </p>
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
              Stack tecnológico
            </p>
            <div className="flex flex-wrap gap-2">
              {STACK.map((t) => (
                <span key={t} className="badge bg-elevated text-fg-soft">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-5">
            <ProgressBar value={completion} label="Completitud del backlog" showValue gradient="violet" />
          </div>
        </Card>

        <Card title="Fase actual" icon="🏷️">
          <div className="text-center">
            <div className="mx-auto mb-3 grid h-20 w-20 place-items-center rounded-full bg-accent/10 text-2xl font-black text-accent shadow-glow">
              {phase}
            </div>
            <div className="flex flex-wrap justify-center gap-1.5">
              {['v0.5', 'v0.6', 'beta', 'v1.0'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPhase(p)}
                  className={clsx(
                    'rounded-md px-2.5 py-1 text-xs font-medium',
                    phase === p ? 'bg-accent/20 text-accent' : 'bg-elevated text-muted hover:bg-control',
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TrackerColumn kind="feature" />
        <TrackerColumn kind="bug" />
      </div>

      <Card title="Últimas actualizaciones" subtitle="Timeline del proyecto" icon="📰">
        <form
          className="mb-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (updateDraft.trim()) {
              addUpdate(updateDraft.trim())
              setUpdateDraft('')
            }
          }}
        >
          <input
            value={updateDraft}
            onChange={(e) => setUpdateDraft(e.target.value)}
            placeholder="Registrar avance de hoy…"
            className="flex-1 rounded-lg border border-surface-border/60 bg-input/60 px-3 py-2 text-sm text-fg placeholder:text-muted-2 focus:border-accent focus:outline-none"
          />
          <button className="rounded-lg bg-accent/15 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/25">
            Añadir
          </button>
        </form>
        {updates.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-2">
            Aún no hay avances registrados. ¡Añade el primero!
          </p>
        )}
        <ol className="relative space-y-4 border-l border-surface-border/60 pl-5">
          {updates.map((u) => (
            <li key={u.id} className="relative">
              <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-accent shadow-glow" />
              <p className="text-sm text-fg">{u.text}</p>
              <p className="text-[11px] text-muted-2">{formatDate(u.date)}</p>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  )
}
