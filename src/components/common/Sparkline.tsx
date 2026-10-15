interface SparklineProps {
  /** Valores en orden cronológico; null = semana sin dato. */
  values: (number | null)[]
  /** Meta opcional, se dibuja como línea punteada. */
  target?: number | null
  className?: string
}

/** Mini gráfico de línea en SVG para la evolución semanal de un indicador. */
export function Sparkline({ values, target, className }: SparklineProps) {
  const w = 160
  const h = 40
  const pad = 4
  const nums = values.filter((v): v is number => v != null)
  const max = Math.max(1, target ?? 0, ...nums)
  // Admite valores negativos (p. ej. la curva de R del diario).
  const min = Math.min(0, target ?? 0, ...nums)
  const stepX = (w - pad * 2) / Math.max(1, values.length - 1)
  const y = (v: number) => h - pad - ((v - min) / (max - min)) * (h - pad * 2)

  // Segmentos continuos (se corta donde no hay dato).
  const segments: string[] = []
  let current = ''
  values.forEach((v, i) => {
    if (v == null) {
      if (current) segments.push(current)
      current = ''
      return
    }
    const x = pad + i * stepX
    current += `${current ? 'L' : 'M'}${x.toFixed(1)},${y(v).toFixed(1)} `
  })
  if (current) segments.push(current)

  const lastIdx = values.map((v, i) => (v == null ? -1 : i)).filter((i) => i >= 0).pop()

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className ?? 'h-10 w-full'} preserveAspectRatio="none" aria-hidden>
      {target != null && (
        <line
          x1={pad}
          x2={w - pad}
          y1={y(target)}
          y2={y(target)}
          stroke="currentColor"
          strokeOpacity="0.35"
          strokeDasharray="3 3"
          strokeWidth="1"
        />
      )}
      {segments.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      ))}
      {lastIdx != null && (
        <circle cx={pad + lastIdx * stepX} cy={y(values[lastIdx] as number)} r="2.5" fill="currentColor" />
      )}
    </svg>
  )
}

export default Sparkline
