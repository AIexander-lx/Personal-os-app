export const inputCls =
  'rounded-lg border border-surface-border/60 bg-input/60 px-2 py-1.5 text-sm text-fg focus:border-accent focus:outline-none'

/** Número de un input: vacío → null. */
export const num = (v: string) => (v.trim() === '' ? null : Number(v))

export function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-elevated/50 p-3">
      <p className="text-[11px] uppercase tracking-wider text-muted">{label}</p>
      <p className="text-lg font-semibold text-fg">{value}</p>
      {hint && <p className="text-[11px] text-muted-2">{hint}</p>}
    </div>
  )
}
