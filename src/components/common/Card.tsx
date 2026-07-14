import { clsx } from 'clsx'
import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode
  subtitle?: ReactNode
  icon?: ReactNode
  action?: ReactNode
  padded?: boolean
}

export function Card({
  title,
  subtitle,
  icon,
  action,
  padded = true,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={clsx('card-surface animate-fade-in', padded && 'p-5', className)}
      {...rest}
    >
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {icon && <span className="text-xl leading-none">{icon}</span>}
            <div>
              {title && (
                <h3 className="text-sm font-semibold tracking-wide text-slate-100">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-slate-400">{subtitle}</p>
              )}
            </div>
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

export default Card
