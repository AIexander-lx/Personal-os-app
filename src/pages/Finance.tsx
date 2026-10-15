import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { clsx } from 'clsx'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Card, ProgressBar, Ring, Sparkline } from '@/components/common'
import IncomeCard from '@/components/IncomeCard'
import { money } from '@/components/MonthlyGoals'
import { inputCls, num } from '@/components/goalsUi'
import { useFinanceStore, useGoalsStore, useJournalStore } from '@/store'
import { plan } from '@/data/plan'
import {
  investTarget,
  journalStats,
  monthKey,
  monthMoney,
  netChange,
  prevMonth,
  todayKey,
  tradeOutcome,
  tradeR,
  INVEST_RULE,
} from '@/utils'
import type { ExpenseCategory } from '@/types'
import Journal from './Journal'

const TABS = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'trading', label: 'Trading' },
  { id: 'ingresos', label: 'Ingresos' },
  { id: 'inversiones', label: 'Inversiones' },
] as const

type TabId = (typeof TABS)[number]['id']

const CATEGORIES: Record<ExpenseCategory, { label: string; icon: string; bar: string }> = {
  comida: { label: 'Comida', icon: '🍔', bar: 'bg-amber-500' },
  transporte: { label: 'Transporte', icon: '🚌', bar: 'bg-sky-500' },
  estudios: { label: 'Estudios', icon: '📚', bar: 'bg-violet-500' },
  negocio: { label: 'Negocio', icon: '💼', bar: 'bg-emerald-500' },
  ocio: { label: 'Ocio', icon: '🎮', bar: 'bg-pink-500' },
  otros: { label: 'Otros', icon: '📦', bar: 'bg-slate-500' },
}

const OUTCOME_CLS = {
  win: 'text-emerald-600 dark:text-emerald-400',
  loss: 'text-rose-600 dark:text-rose-400',
  breakeven: 'text-fg-soft',
  open: 'text-muted',
} as const

const fmtR = (r: number | null) => (r == null ? '—' : `${r > 0 ? '+' : ''}${r.toFixed(2)}R`)
const shortDate = (d: string) => format(parseISO(d), 'd MMM', { locale: es })

/** Datos del mes compartidos por las pestañas. */
function useMonthMoney() {
  const income = useGoalsStore((s) => s.income)
  const currency = useGoalsStore((s) => s.incomeGoal.currency)
  const expenses = useFinanceStore((s) => s.expenses)
  const investments = useFinanceStore((s) => s.investments)
  const month = monthKey(new Date())
  return useMemo(() => {
    const now = monthMoney(income, expenses, investments, month)
    const prev = monthMoney(income, expenses, investments, prevMonth(month))
    return { month, currency, now, change: netChange(now.net, prev.net) }
  }, [income, expenses, investments, month, currency])
}

function SummaryRow({ dot, label, value }: { dot: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={clsx('h-2.5 w-2.5 rounded-full', dot)} />
      <span className="flex-1 text-muted">{label}</span>
      <span className="font-mono font-semibold text-fg">{value}</span>
    </div>
  )
}

function MonthSummary() {
  const { month, currency, now } = useMonthMoney()
  const monthName = format(parseISO(`${month}-01`), 'MMMM', { locale: es })

  return (
    <Card title="Resumen del mes" subtitle={`${monthName} · ingresos del negocio`} icon="📊">
      <div className="flex flex-wrap items-center gap-6">
        <div className="min-w-[12rem] flex-1 space-y-3">
          <SummaryRow dot="bg-emerald-500" label="Ingresos" value={money(now.income, currency)} />
          <SummaryRow dot="bg-rose-500" label="Gastos" value={money(now.expenses, currency)} />
          <SummaryRow dot="bg-violet-500" label="Inversión" value={money(now.invested, currency)} />
          <div className="border-t border-surface-border/50 pt-3">
            <SummaryRow dot="bg-accent" label="Te queda" value={money(now.saved, currency)} />
          </div>
        </div>
        <Ring value={now.savingsRate ?? 0} label={now.savingsRate == null ? 'sin ingresos' : 'tasa de ahorro'} />
      </div>
    </Card>
  )
}

function RecentTrades({ onOpen }: { onOpen: () => void }) {
  const trades = useJournalStore((s) => s.trades)
  const stats = useMemo(() => journalStats(trades), [trades])
  const recent = [...trades].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)

  return (
    <Card
      title="Diario de trading"
      subtitle="Últimas operaciones"
      icon="📒"
      action={
        <button onClick={onOpen} className="text-xs text-accent hover:underline">
          Ver todas →
        </button>
      }
    >
      {recent.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-2">Aún no registras operaciones.</p>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-muted">
              <th className="pb-2 font-medium">Fecha</th>
              <th className="pb-2 font-medium">Par</th>
              <th className="pb-2 font-medium">Tipo</th>
              <th className="pb-2 text-right font-medium">R</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((t) => {
              const outcome = tradeOutcome(t)
              return (
                <tr key={t.id} className="border-t border-surface-border/40">
                  <td className="py-2 text-fg-soft">{shortDate(t.date)}</td>
                  <td className="py-2 font-medium text-fg">{t.pair}</td>
                  <td className="py-2 text-muted">{t.direction === 'long' ? 'Compra' : 'Venta'}</td>
                  <td className={clsx('py-2 text-right font-mono font-semibold', OUTCOME_CLS[outcome])}>
                    {outcome === 'open' ? 'abierta' : fmtR(tradeR(t))}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-elevated/50 p-2">
          <p className="font-mono text-lg font-bold text-fg">{stats.winRate == null ? '—' : `${stats.winRate}%`}</p>
          <p className="text-[10px] uppercase text-muted">acierto</p>
        </div>
        <div className="rounded-lg bg-elevated/50 p-2">
          <p className="font-mono text-lg font-bold text-fg">{stats.avgR == null ? '—' : stats.avgR.toFixed(2)}</p>
          <p className="text-[10px] uppercase text-muted">R promedio</p>
        </div>
        <div className="rounded-lg bg-elevated/50 p-2">
          <p className="font-mono text-lg font-bold text-fg">{stats.total}</p>
          <p className="text-[10px] uppercase text-muted">operaciones</p>
        </div>
      </div>
    </Card>
  )
}

function RCurve() {
  const trades = useJournalStore((s) => s.trades)
  const stats = useMemo(() => journalStats(trades), [trades])
  return (
    <Card
      title="Curva de R"
      subtitle="R acumulado por operación cerrada"
      icon="📈"
      action={
        <span className={clsx('font-mono text-sm font-semibold', stats.totalR >= 0 ? OUTCOME_CLS.win : OUTCOME_CLS.loss)}>
          {fmtR(stats.closed ? stats.totalR : null)}
        </span>
      }
    >
      {stats.equity.length < 2 ? (
        <p className="py-10 text-center text-xs text-muted-2">Aparece desde la segunda operación cerrada.</p>
      ) : (
        <Sparkline values={stats.equity} target={0} className="h-36 w-full text-muted" />
      )}
    </Card>
  )
}

function ExpensesCard() {
  const expenses = useFinanceStore((s) => s.expenses)
  const addExpense = useFinanceStore((s) => s.addExpense)
  const removeExpense = useFinanceStore((s) => s.removeExpense)
  const { month, currency, now } = useMonthMoney()
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('comida')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(todayKey())

  const monthList = expenses.filter((e) => e.date.startsWith(month))
  const byCategory = (Object.keys(CATEGORIES) as ExpenseCategory[])
    .map((c) => ({ c, total: monthList.filter((e) => e.category === c).reduce((s, e) => s + e.amount, 0) }))
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total)

  return (
    <Card title="Gastos del mes" subtitle={`${money(now.expenses, currency)} en ${monthList.length} gastos`} icon="🧾">
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault()
          const n = num(amount)
          if (!n || n <= 0) return
          addExpense({ date, amount: n, category, note })
          setAmount('')
          setNote('')
        }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} aria-label="Fecha" />
          <input
            type="number"
            min={0}
            step="0.01"
            placeholder="Monto"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={clsx(inputCls, 'w-24')}
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            className={clsx(inputCls, 'flex-1')}
            aria-label="Categoría"
          >
            {(Object.keys(CATEGORIES) as ExpenseCategory[]).map((c) => (
              <option key={c} value={c}>
                {CATEGORIES[c].icon} {CATEGORIES[c].label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <input placeholder="Nota (opcional)" value={note} onChange={(e) => setNote(e.target.value)} className={clsx(inputCls, 'min-w-0 flex-1')} />
          <button className="rounded-lg bg-accent/15 px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent/25">Añadir</button>
        </div>
      </form>

      {byCategory.length > 0 && (
        <div className="mt-4 space-y-2">
          {byCategory.map(({ c, total }) => (
            <div key={c}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-fg-soft">
                  {CATEGORIES[c].icon} {CATEGORIES[c].label}
                </span>
                <span className="font-mono text-fg">{money(total, currency)}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-elevated">
                <div className={clsx('h-full rounded-full', CATEGORIES[c].bar)} style={{ width: `${(total / now.expenses) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {monthList.length > 0 && (
        <ul className="mt-4 max-h-56 space-y-1 overflow-y-auto">
          {[...monthList].reverse().map((e) => (
            <li key={e.id} className="flex items-center gap-3 rounded-lg bg-elevated/40 px-3 py-1.5 text-sm">
              <span>{CATEGORIES[e.category].icon}</span>
              <span className="text-xs text-muted">{shortDate(e.date)}</span>
              <span className="min-w-0 flex-1 truncate text-fg-soft">{e.note ?? CATEGORIES[e.category].label}</span>
              <span className="font-mono font-medium text-fg">{money(e.amount, currency)}</span>
              <button onClick={() => removeExpense(e.id)} className="text-xs text-muted hover:text-rose-500" aria-label="Eliminar">
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function Investments() {
  const investments = useFinanceStore((s) => s.investments)
  const addInvestment = useFinanceStore((s) => s.addInvestment)
  const removeInvestment = useFinanceStore((s) => s.removeInvestment)
  const { currency, now } = useMonthMoney()
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('S&P 500')
  const [date, setDate] = useState(todayKey())

  const total = investments.reduce((s, i) => s + i.amount, 0)
  const target = investTarget(now.income)
  const pending = Math.max(0, target.min - now.invested)
  const pct = target.min > 0 ? (now.invested / target.min) * 100 : 0
  const ok = now.income > 0 && now.invested >= target.min

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2" title="Aportes a inversión" subtitle={plan.rules[0]} icon="📈">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-elevated/50 p-3">
            <p className="text-[11px] uppercase tracking-wider text-muted">Total invertido</p>
            <p className="font-mono text-xl font-bold text-fg">{money(total, currency)}</p>
          </div>
          <div className="rounded-lg bg-elevated/50 p-3">
            <p className="text-[11px] uppercase tracking-wider text-muted">Este mes</p>
            <p className="font-mono text-xl font-bold text-fg">{money(now.invested, currency)}</p>
            <p className="text-[11px] text-muted-2">
              {now.investRate == null ? 'sin ingresos aún' : `${Math.round(now.investRate)}% de lo ganado`}
            </p>
          </div>
          <div className="rounded-lg bg-elevated/50 p-3">
            <p className="text-[11px] uppercase tracking-wider text-muted">
              Regla {INVEST_RULE.min * 100}–{INVEST_RULE.max * 100}%
            </p>
            <p className="font-mono text-xl font-bold text-fg">
              {money(target.min, currency)}–{money(target.max, currency)}
            </p>
            <p className={clsx('text-[11px]', ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-2')}>
              {now.income === 0 ? 'se calcula con tus ingresos' : ok ? '✅ cumplida' : `faltan ${money(pending, currency)}`}
            </p>
          </div>
        </div>
        <ProgressBar className="mt-4" value={pct} label="Mínimo del mes" showValue gradient={ok ? 'green' : 'violet'} />

        <form
          className="mt-4 flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            const n = num(amount)
            if (!n || n <= 0) return
            addInvestment({ date, amount: n, note })
            setAmount('')
          }}
        >
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} aria-label="Fecha" />
          <input
            type="number"
            min={0}
            step="0.01"
            placeholder="Monto"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={clsx(inputCls, 'w-28')}
          />
          <input placeholder="Dónde (S&P 500…)" value={note} onChange={(e) => setNote(e.target.value)} className={clsx(inputCls, 'min-w-0 flex-1')} />
          <button className="rounded-lg bg-accent/15 px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent/25">Añadir aporte</button>
        </form>
      </Card>

      <Card title="Historial" subtitle={`${investments.length} aportes`} icon="🗂️">
        {investments.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-2">Registra tu primer aporte apenas cobres.</p>
        ) : (
          <ul className="max-h-80 space-y-1 overflow-y-auto">
            {[...investments].reverse().map((i) => (
              <li key={i.id} className="flex items-center gap-3 rounded-lg bg-elevated/40 px-3 py-1.5 text-sm">
                <span className="text-xs text-muted">{shortDate(i.date)}</span>
                <span className="min-w-0 flex-1 truncate text-fg-soft">{i.note ?? '—'}</span>
                <span className="font-mono font-medium text-fg">{money(i.amount, currency)}</span>
                <button onClick={() => removeInvestment(i.id)} className="text-xs text-muted hover:text-rose-500" aria-label="Eliminar">
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

export default function Finance() {
  const [params, setParams] = useSearchParams()
  const raw = params.get('tab')
  const tab: TabId = TABS.some((t) => t.id === raw) ? (raw as TabId) : 'resumen'
  const setTab = (id: TabId) => setParams(id === 'resumen' ? {} : { tab: id }, { replace: true })
  const { currency, now, change } = useMonthMoney()

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-fg sm:text-3xl">Finanzas</h1>
          <p className="text-sm text-muted">Diario de trading, ingresos, gastos e inversiones.</p>
        </div>
        <div className="rounded-xl border border-surface-border/50 bg-surface-raised px-4 py-2 text-right">
          <p className="text-[10px] uppercase tracking-wider text-muted">Balance del mes</p>
          <p className="font-mono text-xl font-bold text-fg">
            {money(now.net, currency)}
            {change != null && (
              <span className={clsx('ml-2 text-xs', change >= 0 ? OUTCOME_CLS.win : OUTCOME_CLS.loss)}>
                {change >= 0 ? '+' : ''}
                {Math.round(change)}%
              </span>
            )}
          </p>
        </div>
      </header>

      <div className="flex gap-1 overflow-x-auto rounded-lg bg-elevated/60 p-1" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              'flex-1 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              tab === t.id ? 'bg-surface-raised text-accent shadow-sm' : 'text-muted hover:text-fg',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'resumen' && (
        <>
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <MonthSummary />
            <RecentTrades onOpen={() => setTab('trading')} />
          </section>
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <RCurve />
            <ExpensesCard />
          </section>
        </>
      )}
      {tab === 'trading' && <Journal embedded />}
      {tab === 'ingresos' && <IncomeCard />}
      {tab === 'inversiones' && <Investments />}
    </div>
  )
}
