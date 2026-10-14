import { useEffect, useMemo, useState } from 'react'
import { clsx } from 'clsx'
import { addDays, addWeeks, format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Card, Sparkline } from '@/components/common'
import { usePlanStore } from '@/store'
import { plan } from '@/data/plan'
import {
  effectivePhaseNumber,
  kpiActive,
  kpiNumericTarget,
  phaseForDate,
  weekStartKey,
  reviewEarnsXP,
  REVIEW_XP,
} from '@/utils'
import type { WeeklyKpi } from '@/types'

const inputCls =
  'w-24 rounded-lg border border-surface-border/60 bg-input/60 px-2 py-1.5 text-right text-sm text-fg focus:border-accent focus:outline-none disabled:opacity-40 aria-[invalid=true]:border-rose-500'

type FormValues = Record<string, string>

function targetLabel(kpi: WeeklyKpi): string {
  if (kpi.target == null) return 'Sin meta fija'
  if (typeof kpi.target === 'string') return kpi.target
  return `${kpi.target}${kpi.unit ? ` ${kpi.unit}` : ''}`
}

/** true = cumplió, false = no cumplió, null = no aplica (sin meta numérica o sin dato). */
function metTarget(kpi: WeeklyKpi, value: number | null | undefined): boolean | null {
  const t = kpiNumericTarget(kpi)
  if (t == null || value == null) return null
  return value >= t
}

function weekLabel(weekStart: string): string {
  const start = parseISO(weekStart)
  const end = addDays(start, 6)
  return `${format(start, 'd MMM', { locale: es })} – ${format(end, 'd MMM yyyy', { locale: es })}`
}

function toForm(values: Record<string, number | null> | undefined): FormValues {
  const out: FormValues = {}
  for (const k of plan.weeklyKpis) {
    const v = values?.[k.id]
    out[k.id] = v == null ? '' : String(v)
  }
  return out
}

export default function Review() {
  const reviews = usePlanStore((s) => s.reviews)
  const saveReview = usePlanStore((s) => s.saveReview)
  const [offset, setOffset] = useState(0)

  const weekStart = weekStartKey(addWeeks(new Date(), offset))
  const weekDate = parseISO(weekStart)
  const phaseNumber = effectivePhaseNumber(plan.phases, weekDate)
  const phase = phaseForDate(plan.phases, weekDate)
  const existing = reviews.find((r) => r.weekStart === weekStart)

  const [form, setForm] = useState<FormValues>(() => toForm(existing?.values))
  const [note, setNote] = useState(existing?.note ?? '')

  // Al cambiar de semana (o al guardar) se carga lo registrado.
  useEffect(() => {
    setForm(toForm(existing?.values))
    setNote(existing?.note ?? '')
  }, [weekStart, existing])

  const parsed = (id: string): number | null => {
    const raw = form[id]?.trim()
    if (!raw) return null
    const n = Number(raw.replace(',', '.'))
    // Los indicadores no pueden ser negativos.
    return Number.isFinite(n) && n >= 0 ? n : null
  }

  const activeKpis = plan.weeklyKpis.filter((k) => kpiActive(k, phaseNumber))
  const measurable = activeKpis.filter((k) => kpiNumericTarget(k) != null)
  const metCount = measurable.filter((k) => metTarget(k, parsed(k.id)) === true).length

  const ingresos = parsed('ingresos')

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const values: Record<string, number | null> = {}
    for (const k of activeKpis) values[k.id] = parsed(k.id)
    saveReview(weekStart, values, note)
  }

  // Últimas 12 semanas registradas, de la más antigua a la más reciente.
  const recent = useMemo(() => reviews.slice(-12), [reviews])
  const historyKpis = plan.weeklyKpis.filter((k) => recent.some((r) => r.values[k.id] != null))

  return (
    <div className="space-y-6">
      <header className="animate-fade-in">
        <h1 className="text-2xl font-bold text-fg sm:text-3xl">Revisión semanal</h1>
        <p className="text-sm text-muted">Cada domingo de 18:00 a 19:00 · {reviews.length} semanas registradas</p>
      </header>

      <Card
        icon="🧭"
        title={`Semana del ${weekLabel(weekStart)}`}
        subtitle={
          phase ? `Fase ${phase.id} · ${phase.name}` : phaseNumber === 0 ? 'Antes del plan' : 'Después del plan de 90 días'
        }
        action={
          <div className="flex items-center gap-1">
            <button
              onClick={() => setOffset((o) => o - 1)}
              className="h-8 w-8 rounded-md bg-control/70 text-fg hover:bg-control"
              aria-label="Semana anterior"
            >
              ‹
            </button>
            <button
              onClick={() => setOffset(0)}
              disabled={offset === 0}
              className="rounded-md bg-control/70 px-2 py-1.5 text-xs text-fg hover:bg-control disabled:opacity-40"
            >
              Esta semana
            </button>
            <button
              onClick={() => setOffset((o) => Math.min(0, o + 1))}
              disabled={offset >= 0}
              className="h-8 w-8 rounded-md bg-control/70 text-fg hover:bg-control disabled:opacity-40"
              aria-label="Semana siguiente"
            >
              ›
            </button>
          </div>
        }
      >
        <form onSubmit={handleSave} className="space-y-2">
          {plan.weeklyKpis.map((k) => {
            const active = kpiActive(k, phaseNumber)
            const value = parsed(k.id)
            const met = active ? metTarget(k, value) : null
            return (
              <div
                key={k.id}
                className={clsx(
                  'flex flex-wrap items-center gap-3 rounded-lg p-3',
                  active ? 'bg-elevated/40' : 'bg-elevated/20 opacity-60',
                )}
              >
                <div className="min-w-[10rem] flex-1">
                  <p className="text-sm text-fg">{k.label}</p>
                  <p className="text-[11px] text-muted-2">
                    {active ? `Meta: ${targetLabel(k)}` : `Se mide desde la fase ${k.fromPhase}`}
                    {active && k.id === 'aporte_sp500' && ingresos != null && ingresos > 0 && (
                      <>
                        {' '}
                        · 20-30% de S/ {ingresos} = S/ {(ingresos * 0.2).toFixed(0)}–{(ingresos * 0.3).toFixed(0)} (conviértelo a
                        USD al registrar)
                      </>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    aria-invalid={!!form[k.id]?.trim() && value == null}
                    value={form[k.id] ?? ''}
                    disabled={!active}
                    onChange={(e) => setForm((f) => ({ ...f, [k.id]: e.target.value }))}
                    className={inputCls}
                    aria-label={k.label}
                    placeholder="—"
                  />
                  <span className="w-9 text-xs text-muted">{k.unit}</span>
                  <span className="w-5 text-center">
                    {met === true ? '✅' : met === false ? '⚠️' : ''}
                  </span>
                </div>
              </div>
            )
          })}

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="¿Qué funcionó? ¿Qué ajusto la próxima semana?"
            className="mt-2 w-full rounded-lg border border-surface-border/60 bg-input/60 px-3 py-2 text-sm text-fg placeholder:text-muted-2 focus:border-accent focus:outline-none"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <p className="text-xs text-muted">
              Metas cumplidas: <span className="font-semibold text-fg">{metCount}/{measurable.length}</span>
              {existing && <> · guardada {format(parseISO(existing.savedAt), "d MMM HH:mm", { locale: es })}</>}
            </p>
            <button className="rounded-lg bg-accent/15 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/25">
              {existing
                ? '💾 Actualizar revisión'
                : reviewEarnsXP(weekStart)
                  ? `💾 Guardar revisión · +${REVIEW_XP} XP`
                  : '💾 Guardar en el historial'}
            </button>
          </div>
        </form>
      </Card>

      <Card icon="📈" title="Evolución" subtitle="Últimas 12 semanas registradas · la línea punteada es la meta">
        {recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-2">Aún no hay revisiones. Guarda la primera arriba.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {historyKpis.map((k) => {
              const series = recent.map((r) => r.values[k.id] ?? null)
              const last = [...series].reverse().find((v) => v != null)
              return (
                <div key={k.id} className="rounded-lg bg-elevated/40 p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-xs text-muted">{k.label}</p>
                    <p className="text-sm font-semibold text-fg">
                      {last ?? '—'}
                      <span className="ml-0.5 text-[10px] font-normal text-muted">{k.unit}</span>
                    </p>
                  </div>
                  <Sparkline values={series} target={kpiNumericTarget(k)} className="mt-2 h-10 w-full text-muted" />
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {recent.length > 0 && (
        <Card icon="🗂️" title="Historial" subtitle="Toca una semana para editarla">
          <div className="-mx-2 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead>
                <tr className="text-muted">
                  <th className="px-2 py-1.5 font-medium">Semana</th>
                  {historyKpis.map((k) => (
                    <th key={k.id} className="px-2 py-1.5 text-right font-medium">
                      {k.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...recent].reverse().map((r) => (
                  <tr
                    key={r.weekStart}
                    onClick={() => {
                      // Offset en semanas desde la semana actual.
                      const diff = Math.round(
                        (parseISO(r.weekStart).getTime() - parseISO(weekStartKey(new Date())).getTime()) /
                          (7 * 24 * 3600 * 1000),
                      )
                      setOffset(Math.min(0, diff))
                    }}
                    className={clsx(
                      'cursor-pointer border-t border-surface-border/40 hover:bg-elevated/40',
                      r.weekStart === weekStart && 'bg-accent/5',
                    )}
                  >
                    <td className="whitespace-nowrap px-2 py-1.5 text-fg">
                      {format(parseISO(r.weekStart), 'd MMM', { locale: es })}
                    </td>
                    {historyKpis.map((k) => {
                      const v = r.values[k.id]
                      const met = metTarget(k, v)
                      return (
                        <td
                          key={k.id}
                          className={clsx(
                            'px-2 py-1.5 text-right',
                            met === true && 'text-emerald-700 dark:text-emerald-300',
                            met === false && 'text-amber-700 dark:text-amber-300',
                            met === null && 'text-fg-soft',
                          )}
                        >
                          {v ?? '—'}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
