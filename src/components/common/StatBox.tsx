import { clsx } from 'clsx'
import type { ReactNode } from 'react'

interface StatBoxProps {
  label: string
  value: ReactNode
  icon?: ReactNode
  hint?: ReactNode
  accent?: 'cyan' | 'emerald' | 'amber' | 'violet'
  className?: string
}

const accents: Record<NonNullable<StatBoxProps['accent']>, string> = {
  cyan: 'text-cyan-700 dark:text-cyan-300',
  emerald: 'text-emerald-700 dark:text-emerald-300',
  amber: 'text-amber-700 dark:text-amber-300',
  violet: 'text-violet-700 dark:text-violet-300',
}

export function StatBox({ label, value, icon, hint, accent = 'cyan', className }: StatBoxProps) {
  return (
    <div className={clsx('card-surface stat-gradient p-5 animate-fade-in', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted">
          {label}
        </span>
        {icon && <span className="text-lg opacity-80">{icon}</span>}
      </div>
      <div className={clsx('mt-2 font-mono text-3xl font-bold tabular-nums', accents[accent])}>
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  )
}

export default StatBox
