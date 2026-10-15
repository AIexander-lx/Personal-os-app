import { useEffect, useMemo, useState } from 'react'
import { clsx } from 'clsx'
import { addDays, addWeeks, format, getISOWeek, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Card, Sparkline } from '@/components/common'
import { usePlanStore, useJournalStore, useGoalsStore, useUserStore, useFinanceStore } from '@/store'
import { plan } from '@/data/plan'
import {
  effectivePhaseNumber,
  kpiActive,
  kpiNumericTarget,
  phaseForDate,
  weekStartKey,
  reviewEarnsXP,
  reviewStreak,
  weekSuggestions,
  REVIEW_XP,
} from '@/utils'
import type { WeeklyKpi, WeeklyReview } from '@/types'

const inputCls =
  'w-full min-w-0 rounded-lg border border-surface-border/60 bg-input/60 px-2 py-1.5 font-mono text-lg font-bold text-fg focus:border-accent focus:outline-none disabled:opacity-40 aria-[invalid=true]:border-rose-500'

const KPI_ICON: Record<string, string> = {
  horas_negocio: '⏱️',
  negocios_contactados: '🤝',
  propuestas: '📨',
  ingresos: '💰',
  aporte_sp500: '📈',
  ops_demo: '🕯️',
  paginas: '📖',
  entrenamientos: '⚽',
}

type FormValues = Record<string, string>

function targetLabel(kpi: WeeklyKpi): string {
  if (kpi.target == null) return 'sin meta fija'
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
  return `${format(start, 'd', { locale: es })}–${format(end, 'd MMM yyyy', { locale: es })}`
}

function toForm(values: Record<string, number | null> | undefined): FormValues {
  const out: FormValues = {}
  for (const k of plan.weeklyKpis) {
    const v = values?.[k.id]
    out[k.id] = v == null ? '' : String(v)
  }
  return out
}

/** Metas numéricas activas y cuántas se cumplieron en una revisión guardada. */
function reviewScore(r: WeeklyReview): { met: number; total: number } {
  const phase = effectivePhaseNumber(plan.phases, parseISO(r.weekStart))
  const measurable = plan.weeklyKpis.filter((k) => kpiActive(k, phase) && kpiNumericTarget(k) != null)
  return { met: measurable.filter((k) => metTarget(k, r.values[k.id]) === true).length, total: measurable.length }
}

/** Dos líneas: metas cumplidas por semana y objetivo (todas las medibles). */
function EvolutionChart({ reviews }: { reviews: WeeklyReview[] }) {
  const w = 600
  const h = 160
  const pad = 14
  const pts = reviews.map(reviewScore)
  const max = Math.max(1, ...pts.map((p) => p.total))
  const stepX = (w - pad * 2) / Math.max(1, pts.length - 1)
  const x = (i: number) => pad + i * stepX
  const y = (v: number) => h - pad - (v / max) * (h - pad * 2)
  const path = (vals: number[]) => vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')

  return (
    <div>
      <div className="mb-2 flex gap-4 text-[11px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded bg-accent" /> Cumplidas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded border-t border-dashed border-muted" /> Objetivo
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-40 w-full" preserveAspectRatio="none">
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={pad} x2={w - pad} y1={y(max * f)} y2={y(max * f)} stroke="rgb(var(--line))" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        ))}
        <path d={path(pts.map((p) => p.total))} fill="none" stroke="rgb(var(--muted))" strokeDasharray="5 5" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        <path d={path(pts.map((p) => p.met))} fill="none" stroke="rgb(var(--accent))" strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {pts.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.met)} r="3.5" fill="rgb(var(--accent))" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div className="flex justify-between px-1 text-[10px] text-muted-2">
        {reviews.map((r) => (
          <span key={r.weekStart}>S{getISOWeek(parseISO(r.weekStart))}</span>
        ))}
      </div>
    </div>
  )
}

export default function Review() {
  const reviews = usePlanStore((s) => s.reviews)
  const saveReview = usePlanStore((s) => s.saveReview)
  const trades = useJournalStore((s) => s.trades)
  const readingLog = useGoalsStore((s) => s.readingLog)
  const income = useGoalsStore((s) => s.income)
  const currency = useGoalsStore((s) => s.incomeGoal.currency)
  const gym = useUserStore((s) => s.gym)
  const investments = useFinanceStore((s) => s.investments)
  const [offset, setOffset] = useState(0)

  const weekStart = weekStartKey(addWeeks(new Date(), offset))
  const weekDate = parseISO(weekStart)
  const phaseNumber = effectivePhaseNumber(plan.phases, weekDate)
  const phase = phaseForDate(plan.phases, weekDate)
  const existing = reviews.find((r) => r.weekStart === weekStart)
  const previous = reviews.find((r) => r.weekStart === weekStartKey(addWeeks(weekDate, -1)))

  const [form, setForm] = useState<FormValues>(() => toForm(existing?.values))
  const [note, setNote] = useState(existing?.note ?? '')

  // Al cambiar de semana (o al guardar) se carga lo registrado.
  useEffect(() => {
    setForm(toForm(existing?.values))
    setNote(existing?.note ?? '')
  }, [weekStart, existing])

  // Solo lo que la app sí registró (un 0 casi siempre significa "no lo anoté aquí").
  const suggestions = useMemo(() => {
    const all = weekSuggestions({ weekStart, readingLog, gym, trades, income, investments, currency })
    return Object.fromEntries(Object.entries(all).filter(([, v]) => v > 0)) as Record<string, number>
  }, [weekStart, readingLog, gym, trades, income, investments, currency])

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
  const fillable = activeKpis.filter((k) => suggestions[k.id] != null && !form[k.id]?.trim())

  const fillFromApp = () =>
    setForm((f) => {
      const next = { ...f }
      for (const k of fillable) next[k.id] = String(suggestions[k.id])
      return next
    })

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const values: Record<string, number | null> = {}
    for (const k of activeKpis) values[k.id] = parsed(k.id)
    saveReview(weekStart, values, note)
  }

  // Últimas 12 semanas registradas, de la más antigua a la más reciente.
  const recent = useMemo(() => reviews.slice(-12), [reviews])
  const historyKpis = plan.weeklyKpis.filter((k) => recent.some((r) => r.values[k.id] != null))
  const streak = reviewStreak(reviews, weekStartKey(new Date()))
  const earns = reviewEarnsXP(weekStart)

  const navBtn = 'grid h-8 w-8 place-items-center rounded-md bg-control/70 text-fg hover:bg-control disabled:opacity-40'

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-fg sm:text-3xl">Revisión</h1>
          <p className="text-sm text-muted">
            Balance semanal · domingo 18:00–19:00 ·{' '}
            {phase ? `Fase ${phase.id} · ${phase.name}` : phaseNumber === 0 ? 'antes del plan' : 'después del plan de 90 días'}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-surface-border/50 bg-surface-raised p-1">
          <button onClick={() => setOffset((o) => o - 1)} className={navBtn} aria-label="Semana anterior">
            ‹
          </button>
          <div className="px-2 text-center">
            <p className="text-sm font-semibold text-fg">Semana {getISOWeek(weekDate)}</p>
            <p className="text-[11px] text-muted">{weekLabel(weekStart)}</p>
          </div>
          <button onClick={() => setOffset((o) => Math.min(0, o + 1))} disabled={offset >= 0} className={navBtn} aria-label="Semana siguiente">
            ›
          </button>
          {offset !== 0 && (
            <button onClick={() => setOffset(0)} className="rounded-md px-2 py-1.5 text-xs text-accent hover:bg-control">
              Hoy
            </button>
          )}
          {recent.length > 0 && (
            <button
              onClick={() => document.getElementById('historial')?.scrollIntoView({ behavior: 'smooth' })}
              className="rounded-md px-2 py-1.5 text-xs text-fg-soft hover:bg-control"
            >
              Historial
            </button>
          )}
        </div>
      </header>

      <form onSubmit={handleSave}>
        <Card
          icon="🧭"
          title="Indicadores de la semana"
          subtitle={`${metCount}/${measurable.length} metas cumplidas`}
          action={
            fillable.length > 0 && (
              <button
                type="button"
                onClick={fillFromApp}
                className="badge bg-accent/15 text-accent hover:bg-accent/25"
                title={fillable.map((k) => `${k.label}: ${suggestions[k.id]}`).join('\n')}
              >
                ✨ Rellenar con datos de la app ({fillable.length})
              </button>
            )
          }
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {plan.weeklyKpis.map((k) => {
              const active = kpiActive(k, phaseNumber)
              const value = parsed(k.id)
              const met = active ? metTarget(k, value) : null
              const prev = previous?.values[k.id]
              const delta = value != null && prev != null ? value - prev : null
              const suggestion = suggestions[k.id]
              return (
                <div
                  key={k.id}
                  className={clsx(
                    'flex flex-col rounded-xl border p-3 transition-colors',
                    !active && 'border-surface-border/30 bg-elevated/20 opacity-50',
                    active && met === true && 'border-emerald-500/40 bg-emerald-500/5',
                    active && met === false && 'border-amber-500/40 bg-amber-500/5',
                    active && met === null && 'border-surface-border/50 bg-elevated/40',
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-elevated text-base">{KPI_ICON[k.id] ?? '📌'}</span>
                    <p className="min-w-0 flex-1 text-xs leading-tight text-fg-soft">{k.label}</p>
                    <span className="text-sm">{met === true ? '✅' : met === false ? '⚠️' : ''}</span>
                  </div>
                  <div className="mt-3 flex items-end gap-2">
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
                    {delta != null && delta !== 0 && (
                      <span
                        className={clsx(
                          'mb-2 shrink-0 font-mono text-xs font-semibold',
                          delta > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
                        )}
                        title="Contra la semana anterior"
                      >
                        {delta > 0 ? '+' : ''}
                        {Math.round(delta * 10) / 10}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-muted-2">
                    {active ? `Meta: ${targetLabel(k)}` : `Se mide desde la fase ${k.fromPhase}`}
                    {active && suggestion != null && String(suggestion) !== form[k.id]?.trim() && (
                      <>
                        {' · '}
                        <button
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, [k.id]: String(suggestion) }))}
                          className="font-medium text-accent hover:underline"
                        >
                          app: {suggestion}
                        </button>
                      </>
                    )}
                  </p>
                </div>
              )
            })}
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="¿Qué funcionó? ¿Qué ajusto la próxima semana?"
            className="mt-4 w-full rounded-lg border border-surface-border/60 bg-input/60 px-3 py-2 text-sm text-fg placeholder:text-muted-2 focus:border-accent focus:outline-none"
          />

          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted">
              {existing
                ? `Guardada el ${format(parseISO(existing.savedAt), "d MMM 'a las' HH:mm", { locale: es })}`
                : 'Aún no guardas esta semana'}
            </p>
            <button className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-surface transition-opacity hover:opacity-90">
              {existing ? '💾 Actualizar revisión' : earns ? `💾 Guardar revisión · +${REVIEW_XP} XP` : '💾 Guardar en el historial'}
            </button>
          </div>
        </Card>
      </form>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" icon="📈" title="Evolución" subtitle="Últimas 12 semanas registradas">
          {recent.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-2">Aún no hay revisiones. Guarda la primera arriba.</p>
          ) : (
            <>
              <EvolutionChart reviews={recent} />
              <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {historyKpis.map((k) => {
                  const series = recent.map((r) => r.values[k.id] ?? null)
                  const last = [...series].reverse().find((v) => v != null)
                  return (
                    <div key={k.id} className="rounded-lg bg-elevated/40 p-2.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-[11px] text-muted">
                          {KPI_ICON[k.id]} {k.label}
                        </p>
                        <p className="text-xs font-semibold text-fg">{last ?? '—'}</p>
                      </div>
                      <Sparkline values={series} target={kpiNumericTarget(k)} className="mt-1 h-8 w-full text-muted" />
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </Card>

        <Card className="flex flex-col items-center justify-center text-center">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-amber-500/15 text-4xl">{existing ? '🏆' : '🧭'}</span>
          <p className="mt-3 text-lg font-bold text-fg">
            {existing ? '¡Semana revisada!' : earns ? `+${REVIEW_XP} XP te esperan` : 'Semana pasada'}
          </p>
          <p className="mt-1 text-sm text-muted">
            {existing
              ? earns
                ? `Ganaste +${REVIEW_XP} XP por la revisión semanal.`
                : 'Quedó guardada en tu historial.'
              : earns
                ? 'Registra tus indicadores y guarda la revisión.'
                : 'Las semanas viejas se guardan sin XP.'}
          </p>
          <div className="mt-4 rounded-lg bg-elevated/50 px-4 py-2">
            <p className="font-mono text-xl font-bold text-fg">🔥 {streak}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted">{streak === 1 ? 'semana seguida' : 'semanas seguidas'}</p>
          </div>
        </Card>
      </section>

      {recent.length > 0 && (
        <Card id="historial" className="scroll-mt-20" icon="🗂️" title="Historial" subtitle="Toca una semana para editarla">
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
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className={clsx(
                      'cursor-pointer border-t border-surface-border/40 hover:bg-elevated/40',
                      r.weekStart === weekStart && 'bg-accent/5',
                    )}
                  >
                    <td className="whitespace-nowrap px-2 py-1.5 text-fg">
                      S{getISOWeek(parseISO(r.weekStart))} · {format(parseISO(r.weekStart), 'd MMM', { locale: es })}
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
