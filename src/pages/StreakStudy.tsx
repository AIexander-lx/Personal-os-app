import { useState } from 'react'
import { clsx } from 'clsx'
import { Card, ProgressBar } from '@/components/common'
import { formatDate } from '@/utils'
import {
  useProjectStore,
  PROJECT_STAGES,
  type ItemKind,
  type ItemStatus,
  type Priority,
  type TrackerItem,
} from '@/store'

const STACK = ['React', 'TypeScript', 'Expo', 'Node.js', 'PostgreSQL', 'AWS', 'Docker', 'SM-2']
const VERSIONS = ['v0.5', 'v0.6', 'beta', 'v1.0']

const COLUMNS: { id: ItemStatus; title: string; icon: string; dot: string }[] = [
  { id: 'backlog', title: 'Backlog', icon: '📋', dot: 'bg-muted-2' },
  { id: 'doing', title: 'En progreso', icon: '⚙️', dot: 'bg-cyan-500' },
  { id: 'done', title: 'Hecho', icon: '✅', dot: 'bg-emerald-500' },
]

const KIND: Record<ItemKind, { label: string; cls: string }> = {
  feature: { label: 'Feature', cls: 'bg-sky-500/15 text-sky-700 dark:text-sky-300' },
  bug: { label: 'Bug', cls: 'bg-rose-500/15 text-rose-700 dark:text-rose-300' },
  task: { label: 'Task', cls: 'bg-violet-500/15 text-violet-700 dark:text-violet-300' },
}

const PRIORITY: Record<Priority, { label: string; cls: string }> = {
  alta: { label: 'Alta', cls: 'bg-rose-500/15 text-rose-700 dark:text-rose-300' },
  media: { label: 'Media', cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
  baja: { label: 'Baja', cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
}

const inputCls =
  'rounded-lg border border-surface-border/60 bg-input/60 px-2 py-1.5 text-sm text-fg placeholder:text-muted-2 focus:border-accent focus:outline-none'

/** Formulario de tarea: sirve para crear y para editar. */
function TaskForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: TrackerItem
  submitLabel: string
  onSubmit: (v: { title: string; kind: ItemKind; priority: Priority; estimate?: number }) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [kind, setKind] = useState<ItemKind>(initial?.kind ?? 'feature')
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? 'media')
  const [estimate, setEstimate] = useState(initial?.estimate ? String(initial.estimate) : '')

  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault()
        if (!title.trim()) return
        onSubmit({ title: title.trim(), kind, priority, estimate: estimate ? Number(estimate) : undefined })
      }}
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="¿Qué hay que hacer?"
        className={clsx(inputCls, 'w-full')}
        autoFocus
      />
      <div className="flex flex-wrap items-center gap-2">
        <select value={kind} onChange={(e) => setKind(e.target.value as ItemKind)} className={inputCls} aria-label="Tipo">
          <option value="feature">Feature</option>
          <option value="bug">Bug</option>
          <option value="task">Task</option>
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className={inputCls} aria-label="Prioridad">
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </select>
        <label className="flex items-center gap-1 text-xs text-muted">
          <input
            type="number"
            min={0}
            step="0.5"
            value={estimate}
            onChange={(e) => setEstimate(e.target.value)}
            placeholder="0"
            className={clsx(inputCls, 'w-16')}
            aria-label="Horas estimadas"
          />
          h
        </label>
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg bg-elevated px-3 py-1.5 text-xs text-fg-soft hover:bg-control">
            Cancelar
          </button>
          <button className="rounded-lg bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent/25">
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  )
}

function TaskCard({
  item,
  dragging,
  onDragStart,
  onDropBefore,
}: {
  item: TrackerItem
  dragging: boolean
  onDragStart: () => void
  onDropBefore: () => void
}) {
  const updateItem = useProjectStore((s) => s.updateItem)
  const moveItem = useProjectStore((s) => s.moveItem)
  const removeItem = useProjectStore((s) => s.removeItem)
  const [editing, setEditing] = useState(false)
  const col = COLUMNS.findIndex((c) => c.id === item.status)

  if (editing) {
    return (
      <div className="rounded-lg border border-accent/40 bg-elevated/60 p-2.5">
        <TaskForm
          initial={item}
          submitLabel="Guardar"
          onSubmit={(v) => {
            updateItem(item.id, v)
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      </div>
    )
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.stopPropagation()
        onDropBefore()
      }}
      className={clsx(
        'group cursor-grab rounded-lg border border-surface-border/50 bg-elevated/60 p-3 transition-colors hover:border-accent/40 active:cursor-grabbing',
        dragging && 'opacity-40',
        item.status === 'done' && 'opacity-75',
      )}
    >
      <div className="flex items-start gap-2">
        <button
          onClick={() => setEditing(true)}
          className={clsx('flex-1 text-left text-sm font-medium', item.status === 'done' ? 'text-muted line-through' : 'text-fg')}
          title="Editar"
        >
          {item.title}
        </button>
        <button
          onClick={() => removeItem(item.id)}
          className="text-xs text-muted-2 opacity-0 transition-opacity hover:text-rose-600 group-hover:opacity-100 dark:hover:text-rose-400"
          aria-label="Eliminar"
        >
          ✕
        </button>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <span className={clsx('badge text-[10px]', KIND[item.kind].cls)}>{KIND[item.kind].label}</span>
        <span className={clsx('badge text-[10px]', PRIORITY[item.priority].cls)}>{PRIORITY[item.priority].label}</span>
        <span className="ml-auto font-mono text-[11px] text-muted">{item.estimate != null && `${item.estimate}h`}</span>
        {/* Mover sin arrastrar (útil en celular). */}
        <button
          onClick={() => moveItem(item.id, COLUMNS[col - 1].id)}
          disabled={col === 0}
          title={col > 0 ? `Mover a ${COLUMNS[col - 1].title}` : undefined}
          className="grid h-6 w-6 place-items-center rounded-md text-sm text-muted hover:bg-control hover:text-accent disabled:hidden"
        >
          ‹
        </button>
        <button
          onClick={() => moveItem(item.id, COLUMNS[col + 1].id)}
          disabled={col === COLUMNS.length - 1}
          title={col < COLUMNS.length - 1 ? `Mover a ${COLUMNS[col + 1].title}` : undefined}
          className="grid h-6 w-6 place-items-center rounded-md text-sm text-muted hover:bg-control hover:text-accent disabled:hidden"
        >
          ›
        </button>
      </div>
    </div>
  )
}

function Kanban() {
  const items = useProjectStore((s) => s.items)
  const moveItem = useProjectStore((s) => s.moveItem)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overCol, setOverCol] = useState<ItemStatus | null>(null)

  const drop = (status: ItemStatus, beforeId?: string) => {
    if (dragId) moveItem(dragId, status, beforeId)
    setDragId(null)
    setOverCol(null)
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {COLUMNS.map((c) => {
        const list = items.filter((i) => i.status === c.id)
        const hours = list.reduce((s, i) => s + (i.estimate ?? 0), 0)
        return (
          <div
            key={c.id}
            onDragOver={(e) => {
              e.preventDefault()
              setOverCol(c.id)
            }}
            onDragLeave={() => setOverCol(null)}
            onDrop={() => drop(c.id)}
            className={clsx(
              'card-surface flex flex-col p-3 transition-colors md:min-h-[18rem]',
              overCol === c.id && dragId && 'border-accent/60 bg-accent/5',
            )}
          >
            <div className="mb-3 flex items-center gap-2 px-1">
              <span className={clsx('h-2 w-2 rounded-full', c.dot)} />
              <span className="text-sm font-semibold text-fg">{c.title}</span>
              <span className="badge bg-control/60 text-fg-soft">{list.length}</span>
              {hours > 0 && <span className="ml-auto font-mono text-[11px] text-muted">{hours}h</span>}
            </div>
            <div className="flex-1 space-y-2">
              {list.map((item) => (
                <TaskCard
                  key={item.id}
                  item={item}
                  dragging={dragId === item.id}
                  onDragStart={() => setDragId(item.id)}
                  onDropBefore={() => drop(c.id, item.id)}
                />
              ))}
              {list.length === 0 && (
                <p className="rounded-lg border border-dashed border-surface-border/60 py-6 text-center text-xs text-muted-2">
                  Arrastra tareas aquí
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Updates() {
  const updates = useProjectStore((s) => s.updates)
  const addUpdate = useProjectStore((s) => s.addUpdate)
  const [draft, setDraft] = useState('')

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2" title="Avances" subtitle="Bitácora del proyecto" icon="📰">
        <form
          className="mb-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (draft.trim()) {
              addUpdate(draft.trim())
              setDraft('')
            }
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Registrar avance de hoy…"
            className={clsx(inputCls, 'flex-1 px-3 py-2')}
          />
          <button className="rounded-lg bg-accent/15 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/25">Añadir</button>
        </form>
        {updates.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-2">Aún no hay avances registrados. ¡Añade el primero!</p>
        ) : (
          <ol className="relative space-y-4 border-l border-surface-border/60 pl-5">
            {updates.map((u) => (
              <li key={u.id} className="relative">
                <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-accent shadow-glow" />
                <p className="text-sm text-fg">{u.text}</p>
                <p className="text-[11px] text-muted-2">{formatDate(u.date)}</p>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Card title="Sobre el proyecto" icon="📌">
        <p className="text-sm text-fg-soft">
          App de estudio con repaso espaciado (SM-2) y notificaciones channel-agnostic. Objetivo del roadmap: v1.0 con
          monetización.
        </p>
        <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wider text-muted">Stack tecnológico</p>
        <div className="flex flex-wrap gap-2">
          {STACK.map((t) => (
            <span key={t} className="badge bg-elevated text-fg-soft">
              {t}
            </span>
          ))}
        </div>
      </Card>
    </div>
  )
}

/** Fase actual (etapa + % de tareas hechas) y timeline de etapas. */
function StageBar() {
  const items = useProjectStore((s) => s.items)
  const stage = useProjectStore((s) => s.stage)
  const setStage = useProjectStore((s) => s.setStage)
  const done = items.filter((i) => i.status === 'done').length
  const pct = items.length ? (done / items.length) * 100 : 0

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-sm text-muted">
            Fase actual: <span className="font-semibold text-fg">{PROJECT_STAGES[stage]}</span>
          </p>
          <span className="font-mono text-sm font-semibold text-accent">{Math.round(pct)}%</span>
        </div>
        <ProgressBar value={pct} gradient="accent" />
        <p className="mt-2 text-xs text-muted">
          {done}/{items.length} tareas hechas
        </p>
      </Card>

      <Card>
        <p className="mb-3 text-sm text-muted">Timeline del proyecto · toca una etapa para marcarla</p>
        <div className="relative flex items-start justify-between">
          <div className="absolute left-3 right-3 top-[9px] h-0.5 bg-control" />
          <div
            className="absolute left-3 top-[9px] h-0.5 bg-accent transition-[width] duration-500"
            style={{ width: `calc((100% - 1.5rem) * ${stage / (PROJECT_STAGES.length - 1)})` }}
          />
          {PROJECT_STAGES.map((s, i) => (
            <button key={s} onClick={() => setStage(i)} className="relative z-10 flex flex-col items-center gap-1.5">
              <span
                className={clsx(
                  'h-5 w-5 rounded-full border-2 transition-colors',
                  i < stage && 'border-accent bg-accent',
                  i === stage && 'border-accent bg-surface-raised ring-4 ring-accent/25',
                  i > stage && 'border-control bg-surface-raised',
                )}
              />
              <span className={clsx('text-[11px]', i === stage ? 'font-semibold text-accent' : 'text-muted')}>{s}</span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default function StreakStudy() {
  const phase = useProjectStore((s) => s.phase)
  const setPhase = useProjectStore((s) => s.setPhase)
  const addItem = useProjectStore((s) => s.addItem)
  const [tab, setTab] = useState<'kanban' | 'avances'>('kanban')
  const [adding, setAdding] = useState(false)

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3 animate-fade-in">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-fg sm:text-3xl">
            🚀 StreakStudy
            <select
              value={phase}
              onChange={(e) => setPhase(e.target.value)}
              className="rounded-lg border border-surface-border/60 bg-input/60 px-2 py-1 font-mono text-xs font-semibold text-accent focus:border-accent focus:outline-none"
              aria-label="Versión"
            >
              {VERSIONS.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </h1>
          <p className="text-sm text-muted">Tu proyecto principal · features, bugs y progreso</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-lg bg-elevated/60 p-1" role="tablist">
            {(
              [
                ['kanban', 'Kanban'],
                ['avances', 'Avances'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={clsx(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  tab === id ? 'bg-surface-raised text-accent shadow-sm' : 'text-muted hover:text-fg',
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setTab('kanban')
              setAdding(true)
            }}
            className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-surface transition-opacity hover:opacity-90"
          >
            + Nueva tarea
          </button>
        </div>
      </header>

      {adding && (
        <Card title="Nueva tarea" subtitle="Entra al backlog" icon="➕">
          <TaskForm
            submitLabel="Crear"
            onSubmit={(v) => {
              addItem(v)
              setAdding(false)
            }}
            onCancel={() => setAdding(false)}
          />
        </Card>
      )}

      {tab === 'kanban' ? <Kanban /> : <Updates />}

      <StageBar />
    </div>
  )
}
