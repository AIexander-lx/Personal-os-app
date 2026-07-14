import { clsx } from 'clsx'

interface ProgressBarProps {
  value: number // 0-100
  label?: string
  showValue?: boolean
  size?: 'sm' | 'md' | 'lg'
  gradient?: 'accent' | 'green' | 'amber' | 'violet'
  className?: string
}

const gradients: Record<NonNullable<ProgressBarProps['gradient']>, string> = {
  accent: 'from-cyan-400 to-blue-500',
  green: 'from-emerald-400 to-teal-500',
  amber: 'from-amber-400 to-orange-500',
  violet: 'from-violet-400 to-fuchsia-500',
}

const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-3.5' }

export function ProgressBar({
  value,
  label,
  showValue = false,
  size = 'md',
  gradient = 'accent',
  className,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="mb-1 flex items-center justify-between text-xs">
          {label && <span className="text-slate-400">{label}</span>}
          {showValue && (
            <span className="font-semibold text-slate-200">{Math.round(pct)}%</span>
          )}
        </div>
      )}
      <div className={clsx('w-full overflow-hidden rounded-full bg-slate-800', heights[size])}>
        <div
          className={clsx(
            'h-full rounded-full bg-gradient-to-r transition-[width] duration-700 ease-out',
            gradients[gradient],
          )}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  )
}

export default ProgressBar
