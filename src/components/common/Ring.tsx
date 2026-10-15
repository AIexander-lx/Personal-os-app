/** Anillo de progreso (0-100). */
export function Ring({
  value,
  label,
  color = 'var(--accent)',
}: {
  value: number
  label: string
  /** Variable CSS del color del arco (tripleta RGB), p. ej. 'var(--accent)'. */
  color?: string
}) {
  const r = 52
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className="relative grid h-36 w-36 place-items-center">
      <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgb(var(--control))" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={`rgb(${color})`}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="text-center">
        <p className="font-mono text-2xl font-bold text-fg">{Math.round(pct)}%</p>
        <p className="text-[10px] uppercase tracking-wider text-muted">{label}</p>
      </div>
    </div>
  )
}

export default Ring
