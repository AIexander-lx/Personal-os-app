import { Link } from 'react-router-dom'
import { Card, ProgressBar } from '@/components/common'
import { useMonthlyGoals } from '@/components/MonthlyGoals'
import { useCourseStore, usePlanStore, useProjectStore } from '@/store'
import { goal90 } from '@/data/plan'
import { courseProgress } from '@/utils'

/** Avance general de cada área de la app. */
export default function AreaProgress({ className }: { className?: string }) {
  const courses = useCourseStore((s) => s.courses)
  const checklist = usePlanStore((s) => s.checklist)
  const items = useProjectStore((s) => s.items)
  const { training } = useMonthlyGoals()

  const coursePct = courses.length ? courses.reduce((s, c) => s + courseProgress(c), 0) / courses.length : 0
  const planItems = goal90.checklist ?? []
  const planDone = planItems.filter((i) => checklist[i.id]).length
  const projectDone = items.filter((i) => i.status === 'done').length

  const rows = [
    { icon: '🎓', label: 'Estudios', to: '/estudios', value: coursePct, detail: `${Math.round(coursePct)}% del ciclo`, gradient: 'accent' as const },
    { icon: '🎯', label: 'Plan 90 días', to: '/plan', value: planItems.length ? (planDone / planItems.length) * 100 : 0, detail: `${planDone}/${planItems.length} metas`, gradient: 'violet' as const },
    { icon: '🚀', label: 'Proyectos', to: '/proyectos', value: items.length ? (projectDone / items.length) * 100 : 0, detail: `${projectDone}/${items.length} tareas`, gradient: 'amber' as const },
    { icon: '💚', label: 'Bienestar', to: '/bienestar', value: training.planned ? (training.done / training.planned) * 100 : 0, detail: `${training.done}/${training.planned} entrenos`, gradient: 'green' as const },
  ]

  return (
    <Card className={className} title="Tu progreso" subtitle="Avance general por área" icon="📊">
      <div className="space-y-4">
        {rows.map((r) => (
          <Link key={r.to} to={r.to} className="block rounded-lg transition-colors hover:bg-elevated/40">
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 text-fg">
                <span>{r.icon}</span>
                {r.label}
              </span>
              <span className="text-xs text-muted">{r.detail}</span>
            </div>
            <ProgressBar value={r.value} size="sm" gradient={r.gradient} />
          </Link>
        ))}
      </div>
    </Card>
  )
}
