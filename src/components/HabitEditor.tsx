import { clsx } from 'clsx'
import { DayToggles } from '@/components/common'
import { WEEK_DAYS } from '@/data/schedule'
import { useChecklistStore } from '@/store'

/** Editor de los hábitos del checklist diario (nombre, icono y días). */
export function ChecklistEditor() {
  const items = useChecklistStore((s) => s.items)
  const addItem = useChecklistStore((s) => s.addItem)
  const updateItem = useChecklistStore((s) => s.updateItem)
  const removeItem = useChecklistStore((s) => s.removeItem)
  const resetItems = useChecklistStore((s) => s.resetItems)

  return (
    <div className="space-y-2">
      {items.map((it) => (
        <div
          key={it.id}
          className="flex flex-wrap items-center gap-2 rounded-lg border border-surface-border/40 bg-elevated/40 p-2"
        >
          <input
            value={it.icon}
            onChange={(e) => updateItem(it.id, { icon: e.target.value })}
            className="w-10 rounded-md border border-surface-border/60 bg-input/60 px-1 py-1 text-center text-sm focus:border-accent focus:outline-none"
            aria-label="Icono"
          />
          <input
            value={it.label}
            onChange={(e) => updateItem(it.id, { label: e.target.value })}
            className="min-w-[8rem] flex-1 rounded-md border border-surface-border/60 bg-input/60 px-2 py-1 text-sm text-fg focus:border-accent focus:outline-none"
            aria-label="Nombre del ítem"
          />
          <DayToggles
            value={it.days ?? WEEK_DAYS.map((d) => d.code)}
            onChange={(days) =>
              updateItem(it.id, {
                // Todos los días = sin restricción.
                days: days.length === WEEK_DAYS.length ? undefined : days,
              })
            }
          />
          <button
            type="button"
            onClick={() => updateItem(it.id, { wellness: !it.wellness })}
            aria-pressed={!!it.wellness}
            title={it.wellness ? 'Hábito de bienestar (sale en Bienestar)' : 'Marcar como hábito de bienestar'}
            className={clsx(
              'grid h-6 w-6 place-items-center rounded text-xs transition-colors',
              it.wellness ? 'bg-emerald-500/20' : 'bg-control/50 opacity-50 grayscale hover:opacity-100',
            )}
          >
            💚
          </button>
          <button
            onClick={() => removeItem(it.id)}
            className="ml-auto text-muted-2 hover:text-rose-600 dark:hover:text-rose-400"
            aria-label="Eliminar ítem"
          >
            ✕
          </button>
        </div>
      ))}

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => addItem({ label: 'Nuevo ítem', icon: '✅' })}
          className="flex-1 rounded-lg bg-accent/15 px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent/25"
        >
          + Agregar ítem
        </button>
        <button
          onClick={() => resetItems()}
          className="rounded-lg border border-surface-border/60 px-3 py-1.5 text-xs text-muted hover:text-rose-700 dark:hover:text-rose-300"
        >
          ↺ Restaurar
        </button>
      </div>
    </div>
  )
}
