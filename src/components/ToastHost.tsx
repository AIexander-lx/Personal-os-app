import { useEffect } from 'react'
import { useToastStore, type Toast } from '@/store/toastStore'

function ToastCard({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss)

  useEffect(() => {
    const id = window.setTimeout(() => dismiss(toast.id), 5000)
    return () => window.clearTimeout(id)
  }, [toast.id, dismiss])

  return (
    <div
      role="status"
      onClick={() => dismiss(toast.id)}
      className="animate-fade-in flex cursor-pointer items-center gap-3 rounded-card border border-accent/40 bg-surface-raised/95 p-3 pr-4 shadow-glow backdrop-blur"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/15 text-xl">
        {toast.icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-accent">{toast.title}</p>
        <p className="truncate text-xs text-fg-soft">{toast.description}</p>
      </div>
    </div>
  )
}

export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts)
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(92vw,22rem)] flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastCard toast={t} />
        </div>
      ))}
    </div>
  )
}

export default ToastHost
