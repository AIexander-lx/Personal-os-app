import { useState } from 'react'
import { Link } from 'react-router-dom'
import { clsx } from 'clsx'
import { Card } from '@/components/common'
import { ChecklistEditor } from '@/components/HabitEditor'
import { applicableItems, useChecklistStore, useGoalsStore, useUserStore } from '@/store'
import { TRAINING_DAYS } from '@/data/plan'
import { dayCodeOf, DAILY_ITEM_XP, PERFECT_DAY_XP } from '@/utils'
import { money, useMonthlyGoals } from './MonthlyGoals'

const inputCls =
  'rounded-md border border-surface-border/60 bg-input/60 px-2 py-1 text-sm text-fg focus:border-accent focus:outline-none'

function GoalRow({ icon, done, title, hint, children, onToggle, badge }: {
  icon: string
  done: boolean
  title: React.ReactNode
  hint?: React.ReactNode
  children?: React.ReactNode
  onToggle?: () => void
  badge?: React.ReactNode
}) {
  return (
    <div
      className={clsx(
        'flex flex-wrap items-center gap-3 rounded-lg border p-2.5 transition-colors',
        done ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-surface-border/50 bg-elevated/40',
      )}
    >
      <button
        onClick={onToggle}
        disabled={!onToggle}
        className={clsx(
          'grid h-6 w-6 shrink-0 place-items-center rounded-md border text-xs transition-colors',
          done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-surface-border bg-input/60',
          onToggle && !done && 'hover:border-accent',
        )}
        aria-label={done ? 'Desmarcar' : 'Marcar'}
        title={onToggle ? undefined : 'Se marca solo al llegar a la meta'}
      >
        {done && '✓'}
      </button>
      <span className="text-lg">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className={clsx('text-sm', done ? 'text-muted line-through' : 'text-fg')}>{title}</p>
        {hint && <p className="text-[11px] text-muted-2">{hint}</p>}
      </div>
      {children}
      {badge}
    </div>
  )
}

/**
 * Metas de hoy: lo que toca hoy de cada meta del mes (estudio, futsal,
 * lectura, ingresos) más los hábitos del checklist diario.
 */
export default function DailyGoals() {
  const g = useMonthlyGoals()
  const gym = useUserStore((s) => s.gym)
  const toggleGym = useUserStore((s) => s.toggleGym)
  const logPages = useGoalsStore((s) => s.logPages)
  const addIncome = useGoalsStore((s) => s.addIncome)
  const studyDone = useGoalsStore((s) => s.studyDays[g.todayKey] ?? false)
  const toggleStudyDay = useGoalsStore((s) => s.toggleStudyDay)
  const habits = useChecklistStore((s) => s.items)
  const completions = useChecklistStore((s) => s.completions)
  const toggleCompletion = useChecklistStore((s) => s.toggleCompletion)
  const [amount, setAmount] = useState('')
  const [editing, setEditing] = useState(false)

  const isTrainingDay = TRAINING_DAYS.has(dayCodeOf(new Date()))
  const trained = gym.some((x) => x.date === g.todayKey && x.done)
  const { reading, money: m, focus } = g
  const readDone = reading.pace === 0 || reading.today >= reading.pace
  const moneyDone = m.pace === 0 || m.today >= m.pace

  const todayHabits = applicableItems(habits, g.todayKey)
  const habitsDone = new Set(completions[g.todayKey] ?? [])
  const perfectHabits = todayHabits.length > 0 && todayHabits.every((h) => habitsDone.has(h.id))

  const rows = [
    studyDone,
    readDone,
    moneyDone,
    ...(isTrainingDay ? [trained] : []),
    ...todayHabits.map((h) => habitsDone.has(h.id)),
  ]
  const doneCount = rows.filter(Boolean).length
  const allDone = doneCount === rows.length

  return (
    <Card
      title="Metas de hoy"
      subtitle={`${doneCount}/${rows.length} completadas`}
      icon="🎯"
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditing((v) => !v)}
            className={clsx(
              'badge whitespace-nowrap transition-colors',
              editing ? 'bg-accent/20 text-accent' : 'bg-control/60 text-fg-soft hover:text-accent',
            )}
          >
            {editing ? '✓ Listo' : '✏️ Hábitos'}
          </button>
          <Link to="/objetivos" className="whitespace-nowrap text-xs text-accent hover:underline">
            Ver mes →
          </Link>
        </div>
      }
    >
      {editing ? (
        <ChecklistEditor />
      ) : (
        <>
          <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-elevated">
            <div
              className={clsx('h-full rounded-full transition-[width] duration-500', allDone ? 'bg-emerald-500' : 'bg-accent')}
              style={{ width: `${(doneCount / rows.length) * 100}%` }}
            />
          </div>

          <div className="space-y-2">
            <GoalRow
              icon="📚"
              done={studyDone}
              onToggle={() => toggleStudyDay(g.todayKey)}
              title={focus ? <>Estudiar <b>{focus.course.name}</b></> : 'Sesión de estudio'}
              hint={
                focus
                  ? `Necesitas ${focus.status.needed!.toFixed(1)} en lo que falta · tu curso más ajustado`
                  : 'Registra tus notas en Objetivos para saber qué curso priorizar'
              }
            />

            {isTrainingDay && (
              <GoalRow
                icon="⚽"
                done={trained}
                onToggle={() => toggleGym(g.todayKey)}
                title="Entrenar futsal"
                hint={`${g.training.done}/${g.training.planned} entrenamientos este mes`}
              />
            )}

            <GoalRow icon="📖" done={readDone} title={`Leer ${reading.pace} páginas`} hint={`${reading.read}/${reading.target} en el mes`}>
              <label className="flex items-center gap-1 text-xs text-muted">
                <input
                  type="number"
                  min={0}
                  value={reading.today || ''}
                  placeholder="0"
                  onChange={(e) => logPages(g.todayKey, Number(e.target.value) || 0)}
                  className={clsx(inputCls, 'w-16')}
                  aria-label="Páginas leídas hoy"
                />
                pág
              </label>
            </GoalRow>

            <GoalRow
              icon="💼"
              done={moneyDone}
              title={m.pace ? `Generar ${money(m.pace, m.currency)}` : 'Meta de ingresos del mes cumplida 🎉'}
              hint={`Hoy ${money(m.today, m.currency)} · mes ${money(m.earned, m.currency)} / ${money(m.target, m.currency)}`}
            >
              <form
                className="flex items-center gap-1"
                onSubmit={(e) => {
                  e.preventDefault()
                  const n = Number(amount)
                  if (!(n > 0)) return
                  addIncome({ date: g.todayKey, amount: n })
                  setAmount('')
                }}
              >
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={amount}
                  placeholder="+ monto"
                  onChange={(e) => setAmount(e.target.value)}
                  className={clsx(inputCls, 'w-24')}
                  aria-label="Registrar ingreso de hoy"
                />
              </form>
            </GoalRow>

            {todayHabits.map((h) => (
              <GoalRow
                key={h.id}
                icon={h.icon}
                done={habitsDone.has(h.id)}
                onToggle={() => toggleCompletion(g.todayKey, h.id)}
                title={h.label}
                badge={<span className="shrink-0 font-mono text-[10px] text-muted-2">+{DAILY_ITEM_XP}</span>}
              />
            ))}
          </div>

          {perfectHabits && (
            <p className="mt-3 text-center text-xs font-medium text-emerald-700 dark:text-emerald-300">
              ✨ Hábitos completos · +{PERFECT_DAY_XP} XP de bono
            </p>
          )}
        </>
      )}
    </Card>
  )
}
