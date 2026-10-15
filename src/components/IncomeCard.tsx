import { useState } from 'react'
import { clsx } from 'clsx'
import { addMonths, format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Card, ProgressBar } from '@/components/common'
import { money, useMonthlyGoals } from '@/components/MonthlyGoals'
import { Stat, inputCls, num } from '@/components/goalsUi'
import { useGoalsStore } from '@/store'
import { incomeTarget, monthKey } from '@/utils'

export default function IncomeCard() {
  const g = useMonthlyGoals()
  const goal = useGoalsStore((s) => s.incomeGoal)
  const entries = useGoalsStore((s) => s.income)
  const setIncomeGoal = useGoalsStore((s) => s.setIncomeGoal)
  const addIncome = useGoalsStore((s) => s.addIncome)
  const removeIncome = useGoalsStore((s) => s.removeIncome)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(g.todayKey)

  const { target, earned, expected, currency } = g.money
  const ahead = earned >= expected
  const next = incomeTarget(goal, monthKey(addMonths(parseISO(`${g.month}-01`), 1)))
  const monthEntries = entries.filter((e) => e.date.startsWith(g.month))

  return (
    <Card title="Ingresos del negocio" subtitle="Meta mensual que sube cada mes · también la ves en Objetivos" icon="💼">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Este mes" value={money(earned, currency)} hint={`de ${money(target, currency)}`} />
        <Stat
          label="Ritmo"
          value={<span className={ahead ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>{ahead ? 'Adelantado' : 'Atrasado'}</span>}
          hint={`esperado a hoy: ${money(expected, currency)}`}
        />
        <Stat label="Próximo mes" value={money(next, currency)} hint={`+${money(goal.step, currency)}`} />
      </div>
      <ProgressBar className="mt-4" value={target ? (earned / target) * 100 : 0} showValue gradient="accent" />
      <p className="mt-2 text-[11px] text-muted-2">
        El ritmo es solo referencia: los ingresos no llegan parejos día a día, así que aquí no hay meta diaria.
      </p>

      <form
        className="mt-4 flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          const n = num(amount)
          if (!n || n <= 0) return
          addIncome({ date, amount: n, note })
          setAmount('')
          setNote('')
        }}
      >
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
        <input type="number" min={0} step="0.01" placeholder="Monto" value={amount} onChange={(e) => setAmount(e.target.value)} className={clsx(inputCls, 'w-28')} />
        <input placeholder="Nota (cliente, servicio…)" value={note} onChange={(e) => setNote(e.target.value)} className={clsx(inputCls, 'min-w-0 flex-1')} />
        <button className="rounded-lg bg-accent/15 px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent/25">Añadir</button>
      </form>

      {monthEntries.length > 0 && (
        <ul className="mt-3 space-y-1">
          {monthEntries.map((e) => (
            <li key={e.id} className="flex items-center gap-3 rounded-lg bg-elevated/40 px-3 py-1.5 text-sm">
              <span className="text-xs text-muted">{format(parseISO(e.date), 'd MMM', { locale: es })}</span>
              <span className="min-w-0 flex-1 truncate text-fg-soft">{e.note ?? '—'}</span>
              <span className="font-medium text-fg">{money(e.amount, currency)}</span>
              <button onClick={() => removeIncome(e.id)} className="text-xs text-muted hover:text-rose-500" aria-label="Eliminar">
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <details className="mt-4 text-xs text-muted">
        <summary className="cursor-pointer select-none">Configurar meta progresiva</summary>
        <div className="mt-2 flex flex-wrap gap-3">
          <label>
            Desde
            <input type="month" value={goal.startMonth} onChange={(e) => e.target.value && setIncomeGoal({ startMonth: e.target.value })} className={clsx(inputCls, 'mt-1 block')} />
          </label>
          <label>
            Meta inicial
            <input type="number" min={0} value={goal.base} onChange={(e) => setIncomeGoal({ base: num(e.target.value) ?? 0 })} className={clsx(inputCls, 'mt-1 block w-24')} />
          </label>
          <label>
            Sube por mes
            <input type="number" min={0} value={goal.step} onChange={(e) => setIncomeGoal({ step: num(e.target.value) ?? 0 })} className={clsx(inputCls, 'mt-1 block w-24')} />
          </label>
          <label>
            Moneda
            <select value={goal.currency} onChange={(e) => setIncomeGoal({ currency: e.target.value })} className={clsx(inputCls, 'mt-1 block')}>
              <option value="USD">USD</option>
              <option value="PEN">PEN</option>
            </select>
          </label>
        </div>
      </details>
    </Card>
  )
}
