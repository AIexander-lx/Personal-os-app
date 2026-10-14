import { useMemo, useState } from 'react'
import { clsx } from 'clsx'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Card, ProgressBar, Sparkline, StatBox } from '@/components/common'
import { useJournalStore } from '@/store'
import { plan } from '@/data/plan'
import {
  JOURNAL_GOAL,
  PLAN_PAIRS,
  TRADE_XP,
  demoClosedCount,
  journalStats,
  tradeOutcome,
  tradeR,
  validateTrade,
} from '@/utils'
import type { Trade, TradeAccount, TradeDirection, TradeInput } from '@/types'

const inputCls =
  'w-full rounded-lg border border-surface-border/60 bg-input/60 px-3 py-2 text-sm text-fg placeholder:text-muted-2 focus:border-accent focus:outline-none'
const labelCls = 'mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted'

interface FormState {
  date: string
  pair: string
  customPair: string
  direction: TradeDirection
  account: TradeAccount
  entry: string
  stopLoss: string
  exit: string
  pnlUsd: string
  followedRules: boolean
  reason: string
  lesson: string
}

const nowLocal = () => format(new Date(), "yyyy-MM-dd'T'HH:mm")

const emptyForm = (): FormState => ({
  date: nowLocal(),
  pair: PLAN_PAIRS[0],
  customPair: '',
  direction: 'long',
  account: 'demo',
  entry: '',
  stopLoss: '',
  exit: '',
  pnlUsd: '',
  followedRules: true,
  reason: '',
  lesson: '',
})

function fromTrade(t: Trade): FormState {
  const isPlanPair = (PLAN_PAIRS as readonly string[]).includes(t.pair)
  return {
    date: t.date,
    pair: isPlanPair ? t.pair : 'OTRO',
    customPair: isPlanPair ? '' : t.pair,
    direction: t.direction,
    account: t.account,
    entry: String(t.entry),
    stopLoss: String(t.stopLoss),
    exit: t.exit == null ? '' : String(t.exit),
    pnlUsd: t.pnlUsd == null ? '' : String(t.pnlUsd),
    followedRules: t.followedRules,
    reason: t.reason,
    lesson: t.lesson ?? '',
  }
}

/** "1,2345" o "1.2345" → número; vacío o inválido → null. */
function num(raw: string): number | null {
  const s = raw.trim().replace(',', '.')
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

function toInput(f: FormState): Partial<TradeInput> {
  return {
    date: f.date,
    pair: f.pair === 'OTRO' ? f.customPair : f.pair,
    direction: f.direction,
    account: f.account,
    entry: num(f.entry) ?? undefined,
    stopLoss: num(f.stopLoss) ?? undefined,
    exit: num(f.exit),
    pnlUsd: num(f.pnlUsd),
    followedRules: f.followedRules,
    reason: f.reason,
    lesson: f.lesson,
  }
}

const fmtR = (r: number | null) => (r == null ? '—' : `${r > 0 ? '+' : ''}${r.toFixed(2)}R`)

const outcomeStyles = {
  win: 'text-emerald-700 dark:text-emerald-300',
  loss: 'text-rose-700 dark:text-rose-300',
  breakeven: 'text-fg-soft',
  open: 'text-amber-700 dark:text-amber-300',
} as const

const outcomeLabel = { win: 'Ganadora', loss: 'Perdedora', breakeven: 'En cero', open: 'Abierta' } as const

function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div className="flex gap-1 rounded-lg bg-elevated/60 p-1" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={clsx(
            'flex-1 rounded-md px-3 py-1.5 text-sm transition-colors',
            value === o.value ? 'bg-accent/20 font-medium text-accent' : 'text-muted hover:text-fg',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function TradeForm({ editing, onDone }: { editing: Trade | null; onDone: () => void }) {
  const addTrade = useJournalStore((s) => s.addTrade)
  const updateTrade = useJournalStore((s) => s.updateTrade)
  const removeTrade = useJournalStore((s) => s.removeTrade)
  const [form, setForm] = useState<FormState>(() => (editing ? fromTrade(editing) : emptyForm()))
  const [error, setError] = useState<string | null>(null)
  const [confirmDel, setConfirmDel] = useState(false)

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }))

  const draft = toInput(form)
  const preview =
    draft.entry != null && draft.stopLoss != null
      ? tradeR({ direction: form.direction, entry: draft.entry, stopLoss: draft.stopLoss, exit: draft.exit ?? null })
      : null
  const risk = draft.entry != null && draft.stopLoss != null ? Math.abs(draft.entry - draft.stopLoss) : null

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const err = validateTrade(draft)
    if (err) return setError(err)
    setError(null)
    const data = draft as TradeInput
    if (editing) updateTrade(editing.id, data)
    else addTrade(data)
    setForm(emptyForm())
    onDone()
  }

  return (
    <Card
      id="trade-form"
      icon={editing ? '✏️' : '➕'}
      title={editing ? 'Editar operación' : 'Nueva operación'}
      subtitle={editing ? 'Cierra la operación agregando la salida' : `+${TRADE_XP} XP por operación registrada`}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={labelCls} htmlFor="t-date">Fecha y hora</label>
            <input id="t-date" type="datetime-local" value={form.date} onChange={(e) => set('date', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="t-pair">Par</label>
            <select id="t-pair" value={form.pair} onChange={(e) => set('pair', e.target.value)} className={inputCls}>
              {PLAN_PAIRS.map((p) => (
                <option key={p} value={p}>
                  {p === 'XAUUSD' ? 'XAUUSD (oro)' : p}
                </option>
              ))}
              <option value="OTRO">Otro…</option>
            </select>
            {form.pair === 'OTRO' && (
              <input
                value={form.customPair}
                onChange={(e) => set('customPair', e.target.value)}
                placeholder="p. ej. GBPUSD"
                className={clsx(inputCls, 'mt-2')}
                aria-label="Otro par"
              />
            )}
          </div>
          <div>
            <span className={labelCls}>Dirección</span>
            <Segmented
              label="Dirección"
              value={form.direction}
              onChange={(v) => set('direction', v)}
              options={[
                { value: 'long', label: 'Compra' },
                { value: 'short', label: 'Venta' },
              ]}
            />
          </div>
          <div>
            <span className={labelCls}>Cuenta</span>
            <Segmented
              label="Cuenta"
              value={form.account}
              onChange={(v) => set('account', v)}
              options={[
                { value: 'demo', label: 'Demo' },
                { value: 'real', label: 'Real' },
              ]}
            />
          </div>
        </div>

        {form.account === 'real' && (
          <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
            Recuerda tu regla: trading solo en demo hasta tener 30 operaciones registradas con reglas.
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div>
            <label className={labelCls} htmlFor="t-entry">Entrada</label>
            <input id="t-entry" inputMode="decimal" value={form.entry} onChange={(e) => set('entry', e.target.value)} placeholder="1.0850" className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="t-sl">Stop loss</label>
            <input id="t-sl" inputMode="decimal" value={form.stopLoss} onChange={(e) => set('stopLoss', e.target.value)} placeholder="1.0820" className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="t-exit">Salida</label>
            <input id="t-exit" inputMode="decimal" value={form.exit} onChange={(e) => set('exit', e.target.value)} placeholder="Vacío si sigue abierta" className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="t-usd">Resultado USD</label>
            <input id="t-usd" inputMode="decimal" value={form.pnlUsd} onChange={(e) => set('pnlUsd', e.target.value)} placeholder="Opcional, ej. -12.5" className={inputCls} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg bg-elevated/40 px-3 py-2 text-sm">
          <span className="text-muted">
            Riesgo (1R): <span className="font-mono text-fg">{risk ? risk.toPrecision(4) : '—'}</span>
          </span>
          <span className="text-muted">
            Resultado: <span className={clsx('font-semibold', preview == null ? 'text-fg-soft' : preview > 0 ? outcomeStyles.win : preview < 0 ? outcomeStyles.loss : 'text-fg')}>{draft.exit == null ? 'abierta' : fmtR(preview)}</span>
          </span>
          <label className="ml-auto flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={form.followedRules} onChange={(e) => set('followedRules', e.target.checked)} className="h-4 w-4 accent-cyan-400" />
            <span className="text-fg">Respeté mis reglas</span>
          </label>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="t-reason">¿Por qué entré?</label>
            <textarea id="t-reason" rows={3} value={form.reason} onChange={(e) => set('reason', e.target.value)} placeholder="Señal, temporalidad, soporte/resistencia, contexto…" className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="t-lesson">Lección (opcional)</label>
            <textarea id="t-lesson" rows={3} value={form.lesson} onChange={(e) => set('lesson', e.target.value)} placeholder="¿Qué haría distinto?" className={inputCls} />
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button className="rounded-lg bg-accent/15 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/25">
            {editing ? '💾 Guardar cambios' : '📒 Registrar operación'}
          </button>
          {editing && (
            <>
              <button type="button" onClick={onDone} className="rounded-lg bg-elevated px-3 py-2 text-sm text-fg-soft hover:bg-control">
                Cancelar
              </button>
              {confirmDel ? (
                <button
                  type="button"
                  onClick={() => {
                    removeTrade(editing.id)
                    onDone()
                  }}
                  className="ml-auto rounded-lg bg-rose-500/15 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-500/25 dark:text-rose-300"
                >
                  Sí, eliminar (−{TRADE_XP} XP)
                </button>
              ) : (
                <button type="button" onClick={() => setConfirmDel(true)} className="ml-auto text-sm text-muted hover:text-rose-700 dark:hover:text-rose-300">
                  🗑 Eliminar
                </button>
              )}
            </>
          )}
        </div>
      </form>
    </Card>
  )
}

function TradeRow({ t, onEdit, active }: { t: Trade; onEdit: () => void; active: boolean }) {
  const r = tradeR(t)
  const outcome = tradeOutcome(t)
  return (
    <button
      onClick={onEdit}
      className={clsx(
        'w-full rounded-lg border p-3 text-left transition-colors hover:bg-elevated/60',
        active ? 'border-accent/50 bg-accent/5' : 'border-surface-border/40 bg-elevated/30',
      )}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-semibold text-fg">{t.pair}</span>
        <span className={clsx('badge', t.direction === 'long' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/15 text-rose-700 dark:text-rose-300')}>
          {t.direction === 'long' ? 'Compra' : 'Venta'}
        </span>
        {t.account === 'real' && <span className="badge bg-amber-500/15 text-amber-700 dark:text-amber-300">Real</span>}
        <span className="text-xs text-muted">{format(parseISO(t.date), "d MMM yyyy · HH:mm", { locale: es })}</span>
        <span className={clsx('ml-auto text-sm font-semibold', outcomeStyles[outcome])}>
          {outcome === 'open' ? outcomeLabel.open : fmtR(r)}
          {t.pnlUsd != null && <span className="ml-2 text-xs font-normal text-muted">{t.pnlUsd >= 0 ? '+' : ''}{t.pnlUsd} USD</span>}
        </span>
      </div>
      <div className="mt-1 flex flex-wrap gap-x-4 font-mono text-[11px] text-muted">
        <span>E {t.entry}</span>
        <span>SL {t.stopLoss}</span>
        <span>S {t.exit ?? '—'}</span>
        <span className={t.followedRules ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}>
          {t.followedRules ? '✓ reglas' : '✗ sin reglas'}
        </span>
      </div>
      <p className="mt-1 line-clamp-2 text-sm text-fg-soft">{t.reason}</p>
      {t.lesson && <p className="mt-0.5 line-clamp-1 text-xs text-muted">💡 {t.lesson}</p>}
    </button>
  )
}

export default function Journal() {
  const trades = useJournalStore((s) => s.trades)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pairFilter, setPairFilter] = useState<string>('all')
  const [formKey, setFormKey] = useState(0)

  const stats = useMemo(() => journalStats(trades), [trades])
  const demoDone = demoClosedCount(trades)
  const editing = trades.find((t) => t.id === editingId) ?? null
  const pairs = useMemo(() => [...new Set(trades.map((t) => t.pair))].sort(), [trades])
  const visible = pairFilter === 'all' ? trades : trades.filter((t) => t.pair === pairFilter)

  const closeForm = () => {
    setEditingId(null)
    setFormKey((k) => k + 1)
  }

  return (
    <div className="space-y-6">
      <header className="animate-fade-in">
        <h1 className="text-2xl font-bold text-fg sm:text-3xl">Diario de trading</h1>
        <p className="text-sm text-muted">{plan.rules[2]}</p>
      </header>

      <Card icon="🎯" title={`Meta: ${JOURNAL_GOAL} operaciones en demo`} subtitle="Al llegar, se marca sola en el checklist de 90 días">
        <ProgressBar value={(demoDone / JOURNAL_GOAL) * 100} showValue gradient={demoDone >= JOURNAL_GOAL ? 'green' : 'accent'} />
        <p className="mt-1 text-xs text-muted">
          {demoDone}/{JOURNAL_GOAL} cerradas en demo{stats.open > 0 && ` · ${stats.open} abierta${stats.open === 1 ? '' : 's'}`}
        </p>
      </Card>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatBox label="Acierto" value={stats.winRate == null ? '—' : `${stats.winRate}%`} icon="🎯" accent="emerald" hint={`${stats.wins} ganadas · ${stats.losses} perdidas`} />
        <StatBox label="R promedio" value={stats.avgR == null ? '—' : fmtR(stats.avgR)} icon="⚖️" accent="cyan" hint={`${stats.closed} cerradas`} />
        <StatBox label="R total" value={fmtR(stats.closed ? stats.totalR : null)} icon="📈" accent="violet" hint={stats.pnlUsd ? `${stats.pnlUsd >= 0 ? '+' : ''}${stats.pnlUsd} USD registrados` : 'USD opcional'} />
        <StatBox label="Con reglas" value={stats.rulesPct == null ? '—' : `${stats.rulesPct}%`} icon="📏" accent="amber" hint="de las operaciones" />
      </section>

      <TradeForm key={`${editingId ?? 'new'}-${formKey}`} editing={editing} onDone={closeForm} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card
          className="lg:col-span-2"
          icon="📒"
          title="Operaciones"
          subtitle="Toca una para editarla o cerrarla"
          action={
            pairs.length > 1 ? (
              <select
                value={pairFilter}
                onChange={(e) => setPairFilter(e.target.value)}
                className="rounded-md border border-surface-border/60 bg-input/60 px-2 py-1 text-xs text-fg focus:border-accent focus:outline-none"
                aria-label="Filtrar por par"
              >
                <option value="all">Todos los pares</option>
                {pairs.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            ) : undefined
          }
        >
          {visible.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-2">Aún no hay operaciones. Registra la primera arriba.</p>
          ) : (
            <div className="space-y-2">
              {visible.map((t) => (
                <TradeRow
                  key={t.id}
                  t={t}
                  active={t.id === editingId}
                  onEdit={() => {
                    setEditingId(t.id)
                    document.getElementById('trade-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                />
              ))}
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card icon="📈" title="Curva de R" subtitle="R acumulado por operación cerrada">
            {stats.equity.length < 2 ? (
              <p className="py-6 text-center text-xs text-muted-2">Aparece desde la segunda operación cerrada.</p>
            ) : (
              <Sparkline values={stats.equity} target={0} className="h-28 w-full text-muted" />
            )}
          </Card>
          <Card icon="🧮" title="Por par">
            {stats.byPair.length === 0 ? (
              <p className="text-xs text-muted-2">Sin datos todavía.</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-muted">
                    <th className="py-1 font-medium">Par</th>
                    <th className="py-1 text-right font-medium">Cerradas</th>
                    <th className="py-1 text-right font-medium">Acierto</th>
                    <th className="py-1 text-right font-medium">R</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.byPair.map((p) => (
                    <tr key={p.pair} className="border-t border-surface-border/40">
                      <td className="py-1.5 text-fg">{p.pair}</td>
                      <td className="py-1.5 text-right text-fg-soft">{p.closed}</td>
                      <td className="py-1.5 text-right text-fg-soft">{p.winRate == null ? '—' : `${p.winRate}%`}</td>
                      <td className={clsx('py-1.5 text-right font-semibold', p.totalR > 0 ? outcomeStyles.win : p.totalR < 0 ? outcomeStyles.loss : 'text-fg-soft')}>
                        {fmtR(p.closed ? p.totalR : null)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
