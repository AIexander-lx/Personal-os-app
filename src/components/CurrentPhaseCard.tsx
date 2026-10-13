import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Card, ProgressBar } from '@/components/common'
import { PhaseTasks, usePhaseTaskCount } from '@/components/PhaseTasks'
import { plan } from '@/data/plan'
import { getPhaseStatus } from '@/utils'

const short = (d: string) => format(parseISO(d), 'd MMM', { locale: es })

/** Fase actual del temario según la fecha de hoy, con sus tareas. */
export function CurrentPhaseCard({ compact = false }: { compact?: boolean }) {
  // Se recalcula cada 10 min por si la app queda abierta al cambiar de día.
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 10 * 60_000)
    return () => window.clearInterval(id)
  }, [])

  const status = getPhaseStatus(plan.phases, now)
  const phase = status.kind === 'active' ? status.phase : status.kind === 'before' ? status.next : status.last
  const count = usePhaseTaskCount(phase)

  const link = compact ? (
    <Link to="/plan" className="badge bg-accent/10 text-accent hover:bg-accent/20">
      Ver plan →
    </Link>
  ) : undefined

  if (status.kind === 'after') {
    return (
      <Card icon="🏁" title="Plan de 90 días terminado" subtitle={`Cerró el ${short(status.last.end)}`} action={link}>
        <p className="text-sm text-fg-soft">
          Toca la <span className="font-semibold text-fg">revisión de 90 días</span>: compara el checklist con lo logrado y
          define el siguiente ciclo.
        </p>
      </Card>
    )
  }

  const title =
    status.kind === 'before'
      ? `Empieza en ${status.daysUntil} ${status.daysUntil === 1 ? 'día' : 'días'} · Fase 1 · ${phase.name}`
      : `Fase ${phase.id} de ${plan.phases.length} · ${phase.name}`

  const subtitle =
    status.kind === 'before'
      ? `Arranca el lunes ${short(phase.start)} · prepárate`
      : `${short(phase.start)} – ${short(phase.end)} · día ${status.dayOfPhase} de ${status.phaseDays} · ${
          status.daysLeft === 0 ? 'último día' : `quedan ${status.daysLeft} días`
        }`

  return (
    <Card icon="🧭" title={title} subtitle={subtitle} action={link}>
      {status.kind === 'active' && (
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ProgressBar
            value={(status.dayOfPhase / status.phaseDays) * 100}
            label="Avance de la fase"
            showValue
            size="sm"
          />
          <ProgressBar
            value={status.planProgress}
            label={`Plan 90 días · quedan ${status.planDaysLeft} días`}
            showValue
            size="sm"
            gradient="violet"
          />
        </div>
      )}
      <PhaseTasks phase={phase} />
      <p className="mt-2 text-right text-[11px] text-muted-2">
        {count.done}/{count.total} tareas de la fase
      </p>
    </Card>
  )
}

export default CurrentPhaseCard
