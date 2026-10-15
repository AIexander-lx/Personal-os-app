import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Card, ProgressBar } from '@/components/common'
import { useCourseStore, useGoalsStore, useUserStore } from '@/store'
import { TRAINING_DAYS } from '@/data/plan'
import {
  dailyPace,
  daysLeftInMonth,
  gradeStatus,
  incomeOfMonth,
  incomeTarget,
  monthKey,
  sumMonth,
  trainingMonth,
  type GradeStatus,
} from '@/utils'

/** Todos los números del mes en curso, derivados de los stores. */
export function useMonthlyGoals(now = new Date()) {
  const courses = useCourseStore((s) => s.courses)
  const gym = useUserStore((s) => s.gym)
  const { passingGrade, evaluations, pagesPerDay, readingLog, incomeGoal, income } = useGoalsStore()

  const todayKey = format(now, 'yyyy-MM-dd')
  const month = monthKey(now)
  const daysInMonth = now.getDate() + daysLeftInMonth(now) - 1
  const daysLeft = daysLeftInMonth(now)

  return useMemo(() => {
    const grades = courses.map((c) => ({ course: c, status: gradeStatus(evaluations[c.id] ?? [], passingGrade) }))
    // Curso al que darle prioridad hoy: el que pide la nota más alta en lo que falta.
    const focus = grades
      .filter((x) => x.status.needed != null && x.status.needed > 0 && x.status.state !== 'sin-datos')
      .sort((a, b) => b.status.needed! - a.status.needed!)[0]

    const training = trainingMonth(
      TRAINING_DAYS,
      new Set(gym.filter((g) => g.done).map((g) => g.date)),
      now,
    )

    const readTarget = pagesPerDay * daysInMonth
    const readBefore = sumMonth(readingLog, month, todayKey)
    const readToday = readingLog[todayKey] ?? 0
    const reading = {
      target: readTarget,
      read: readBefore + readToday,
      today: readToday,
      pace: dailyPace(readTarget, readBefore, daysLeft),
    }

    const target = incomeTarget(incomeGoal, month)
    const earned = incomeOfMonth(income, month)
    const earnedToday = incomeOfMonth(income, todayKey)
    const money = {
      target,
      earned,
      // Lo "esperado" a esta altura si fuera lineal; solo de referencia, no es meta diaria.
      expected: Math.round((target * now.getDate()) / daysInMonth),
      today: earnedToday,
      pace: dailyPace(target, earned - earnedToday, daysLeft),
      currency: incomeGoal.currency,
    }

    return { month, daysInMonth, daysLeft, todayKey, grades, focus, training, reading, money }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courses, gym, passingGrade, evaluations, pagesPerDay, readingLog, incomeGoal, income, todayKey])
}

export const GRADE_LABEL: Record<GradeStatus['state'], { text: string; className: string }> = {
  'sin-datos': { text: 'Sin notas', className: 'bg-control/60 text-muted' },
  aprobado: { text: 'Aprobado', className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
  'en-camino': { text: 'En camino', className: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300' },
  'en-riesgo': { text: 'En riesgo', className: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
  imposible: { text: 'No alcanza', className: 'bg-rose-500/15 text-rose-700 dark:text-rose-300' },
  desaprobado: { text: 'Desaprobado', className: 'bg-rose-500/15 text-rose-700 dark:text-rose-300' },
}

export const money = (n: number, currency: string) =>
  `${currency === 'USD' ? '$' : currency + ' '}${n.toLocaleString('es-PE', { maximumFractionDigits: 2 })}`

const pct = (a: number, b: number) => (b > 0 ? Math.min(100, (a / b) * 100) : 0)

function Row({ icon, label, detail, value, gradient }: {
  icon: string
  label: string
  detail: React.ReactNode
  value: number
  gradient: 'accent' | 'green' | 'amber' | 'violet'
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
        <span className="flex items-center gap-2 text-fg">
          <span>{icon}</span>
          {label}
        </span>
        <span className="text-right text-xs text-muted">{detail}</span>
      </div>
      <ProgressBar value={value} size="sm" gradient={gradient} />
    </div>
  )
}

/** Resumen de las 4 metas del mes (Dashboard y cabecera de Metas). */
export default function MonthlyGoals({ linkToPage = false }: { linkToPage?: boolean }) {
  const g = useMonthlyGoals()
  const withGrades = g.grades.filter((x) => x.status.state !== 'sin-datos')
  const ok = withGrades.filter((x) => x.status.state === 'aprobado' || x.status.state === 'en-camino').length
  const atRisk = withGrades.length - ok
  const monthName = format(new Date(), 'MMMM', { locale: es })
  const overall = Math.round(
    (pct(ok, g.grades.length) +
      pct(g.training.done, g.training.planned) +
      pct(g.reading.read, g.reading.target) +
      pct(g.money.earned, g.money.target)) /
      4,
  )

  return (
    <Card
      title="Metas del mes"
      subtitle={`${monthName} · quedan ${g.daysLeft} ${g.daysLeft === 1 ? 'día' : 'días'}`}
      icon="🎯"
      action={
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-semibold text-accent">{overall}%</span>
          {linkToPage && (
            <Link to="/objetivos" className="text-xs text-accent hover:underline">
              Ver detalle →
            </Link>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        <Row
          icon="📚"
          label="Aprobar cursos"
          value={pct(ok, g.grades.length)}
          gradient={atRisk ? 'amber' : 'green'}
          detail={
            withGrades.length
              ? `${ok}/${g.grades.length} bien${atRisk ? ` · ${atRisk} en riesgo` : ''}`
              : 'Registra tus notas'
          }
        />
        <Row
          icon="⚽"
          label="Entrenamientos"
          value={pct(g.training.done, g.training.planned)}
          gradient="green"
          detail={`${g.training.done}/${g.training.planned} días${g.training.missed ? ` · ${g.training.missed} perdidos` : ''}`}
        />
        <Row
          icon="📖"
          label="Lectura"
          value={pct(g.reading.read, g.reading.target)}
          gradient="violet"
          detail={
            <>
              {g.reading.read}/{g.reading.target} pág ·{' '}
              <span className={g.reading.today >= g.reading.pace ? 'text-emerald-600 dark:text-emerald-400' : 'text-fg'}>
                hoy {g.reading.today}/{g.reading.pace}
              </span>
            </>
          }
        />
        <Row
          icon="💼"
          label="Ingresos"
          value={pct(g.money.earned, g.money.target)}
          gradient="accent"
          detail={`${money(g.money.earned, g.money.currency)} / ${money(g.money.target, g.money.currency)}`}
        />
      </div>
    </Card>
  )
}
