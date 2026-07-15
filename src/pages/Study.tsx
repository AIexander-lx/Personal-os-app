import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, StatBox } from '@/components/common'
import { useUserStore, useCourseStore, useGamificationStore } from '@/store'
import { sessionXP, formatClock, formatDuration, formatDateTime } from '@/utils'
import { isAfter, subDays, parseISO } from 'date-fns'

const PRESETS = [25, 45, 90]

/** Beep corto con WebAudio (sin assets externos). */
function playChime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const notes = [660, 880, 1046]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = freq
      osc.type = 'sine'
      osc.connect(gain)
      gain.connect(ctx.destination)
      const t = ctx.currentTime + i * 0.18
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35)
      osc.start(t)
      osc.stop(t + 0.4)
    })
  } catch {
    /* audio no disponible */
  }
}

/** Notificación del navegador (si el usuario dio permiso). */
function notify(title: string, body: string) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  try {
    new Notification(title, { body, icon: '/icon.svg', tag: 'personal-os-timer' })
  } catch {
    /* algunos navegadores exigen ServiceWorkerRegistration.showNotification */
  }
}

export default function Study() {
  const courses = useCourseStore((s) => s.courses)
  const sessions = useUserStore((s) => s.sessions)
  const addSession = useUserStore((s) => s.addSession)
  const evaluate = useGamificationStore((s) => s.evaluate)

  const [courseId, setCourseId] = useState(courses[0]?.id ?? '')
  const selectedCourse = courses.find((c) => c.id === courseId) ?? courses[0]
  const [topicId, setTopicId] = useState(selectedCourse?.topics[0]?.id ?? '')

  const [minutes, setMinutes] = useState(45)
  const [customMinutes, setCustomMinutes] = useState(45)
  const [remaining, setRemaining] = useState(45 * 60)
  const [running, setRunning] = useState(false)
  /** Timestamp de fin; el reloj se deriva de él para no desfasarse en pestañas de fondo. */
  const [endsAt, setEndsAt] = useState<number | null>(null)
  const [lastReward, setLastReward] = useState<{ xp: number; topic: string } | null>(null)
  const [notifPerm, setNotifPerm] = useState<NotificationPermission | 'unsupported'>(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  )

  const topic = selectedCourse?.topics.find((t) => t.id === topicId) ?? selectedCourse?.topics[0]

  // Al cambiar de curso, ajustar el tema seleccionado.
  useEffect(() => {
    if (selectedCourse && !selectedCourse.topics.some((t) => t.id === topicId)) {
      setTopicId(selectedCourse.topics[0]?.id ?? '')
    }
  }, [selectedCourse, topicId])

  const requestNotifications = async () => {
    if (typeof Notification === 'undefined') return
    setNotifPerm(await Notification.requestPermission())
  }

  const complete = () => {
    setRunning(false)
    setEndsAt(null)
    playChime()
    if (selectedCourse && topic) {
      const s = addSession({
        courseId: selectedCourse.id,
        courseName: selectedCourse.name,
        topicId: topic.id,
        topicName: topic.name,
        duration: minutes,
      })
      evaluate()
      setLastReward({ xp: s.xp, topic: topic.name })
      notify('¡Sesión completada! 🎉', `+${s.xp} XP en ${topic.name}`)
    }
    setRemaining(minutes * 60)
  }

  // `complete` se guarda en un ref para que el tick siempre use la versión actual.
  const completeRef = useRef(complete)
  completeRef.current = complete

  // Tick del timer, derivado de `endsAt` (inmune al throttling de pestañas en fondo).
  useEffect(() => {
    if (!running || endsAt === null) return
    let fired = false
    const tick = () => {
      const left = Math.max(0, Math.round((endsAt - Date.now()) / 1000))
      setRemaining(left)
      if (left <= 0 && !fired) {
        fired = true
        completeRef.current()
      }
    }
    tick()
    const id = window.setInterval(tick, 250)
    return () => window.clearInterval(id)
  }, [running, endsAt])

  const toggleRun = () => {
    if (running) {
      setRunning(false)
      setEndsAt(null) // `remaining` ya quedó sincronizado por el último tick
    } else {
      if (remaining <= 0) setRemaining(minutes * 60)
      setEndsAt(Date.now() + (remaining > 0 ? remaining : minutes * 60) * 1000)
      setRunning(true)
    }
  }

  const resetTimer = () => {
    setRunning(false)
    setEndsAt(null)
    setRemaining(minutes * 60)
  }

  const progressPct = ((minutes * 60 - remaining) / (minutes * 60)) * 100
  const projectedXP = sessionXP(minutes)

  // Stats
  const stats = useMemo(() => {
    const totalMin = sessions.reduce((s, x) => s + x.duration, 0)
    const weekStart = subDays(new Date(), 7)
    const thisWeek = sessions.filter((s) => isAfter(parseISO(s.date), weekStart)).length
    const avg = sessions.length ? Math.round(totalMin / sessions.length) : 0
    return { totalHours: (totalMin / 60).toFixed(1), thisWeek, avg }
  }, [sessions])

  const setPreset = (m: number) => {
    setMinutes(m)
    setRunning(false)
    setEndsAt(null)
    setRemaining(m * 60)
  }

  // Círculo de progreso.
  const R = 88
  const C = 2 * Math.PI * R
  const dash = C - (progressPct / 100) * C

  return (
    <div className="space-y-6">
      <header className="animate-fade-in">
        <h1 className="text-2xl font-bold text-fg sm:text-3xl">Sesiones de estudio</h1>
        <p className="text-sm text-muted">Timer Pomodoro · cálculo de XP en vivo</p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Timer */}
        <Card className="lg:col-span-2" title="Timer" subtitle="Concéntrate y suma XP" icon="⏱️">
          <div className="grid gap-6 sm:grid-cols-2 sm:items-center">
            <div className="flex flex-col items-center justify-center">
              <div className="relative grid place-items-center">
                <svg width="220" height="220" viewBox="0 0 220 220" className="-rotate-90">
                  <circle cx="110" cy="110" r={R} fill="none" stroke="#1e293b" strokeWidth="12" />
                  <circle
                    cx="110"
                    cy="110"
                    r={R}
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={C}
                    strokeDashoffset={dash}
                    className="transition-[stroke-dashoffset] duration-1000 ease-linear"
                  />
                </svg>
                <div className="absolute text-center">
                  <div className="font-mono text-4xl font-bold text-fg">
                    {formatClock(remaining)}
                  </div>
                  <div className="text-xs text-muted">
                    {running ? 'en curso…' : 'listo'}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={toggleRun}
                  className="rounded-lg bg-accent/15 px-5 py-2 font-semibold text-accent hover:bg-accent/25"
                >
                  {running ? '⏸ Pausar' : '▶ Iniciar'}
                </button>
                <button
                  onClick={resetTimer}
                  className="rounded-lg bg-elevated px-4 py-2 font-semibold text-fg hover:bg-control"
                >
                  ↺ Reset
                </button>
                <button
                  onClick={complete}
                  className="rounded-lg bg-emerald-500/15 px-4 py-2 font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25"
                  title="Marcar sesión como completada"
                >
                  ✓ Completar
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Curso</label>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full rounded-lg border border-surface-border/60 bg-input/60 px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Tema</label>
                <select
                  value={topicId}
                  onChange={(e) => setTopicId(e.target.value)}
                  className="w-full rounded-lg border border-surface-border/60 bg-input/60 px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
                >
                  {selectedCourse?.topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Duración</label>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((m) => (
                    <button
                      key={m}
                      onClick={() => setPreset(m)}
                      className={
                        'rounded-lg px-3 py-1.5 text-sm font-medium ' +
                        (minutes === m
                          ? 'bg-accent/20 text-accent'
                          : 'bg-elevated text-fg-soft hover:bg-control')
                      }
                    >
                      {m} min
                    </button>
                  ))}
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={240}
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(Number(e.target.value))}
                      className="w-16 rounded-lg border border-surface-border/60 bg-input/60 px-2 py-1.5 text-sm text-fg focus:border-accent focus:outline-none"
                    />
                    <button
                      onClick={() => setPreset(Math.max(1, customMinutes))}
                      className="rounded-lg bg-elevated px-2 py-1.5 text-sm text-fg-soft hover:bg-control"
                    >
                      set
                    </button>
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-cyan-500/10 p-3">
                <p className="text-xs text-cyan-900 dark:text-cyan-200/80">XP proyectado (al completar)</p>
                <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">
                  +{projectedXP} XP
                </p>
                <p className="text-[11px] text-muted">
                  50 base + {minutes} × 0.5 bonus
                </p>
              </div>

              {notifPerm === 'default' && (
                <button
                  onClick={requestNotifications}
                  className="w-full rounded-lg border border-surface-border/60 px-3 py-1.5 text-xs text-fg-soft transition-colors hover:border-accent/50 hover:text-accent"
                >
                  🔔 Activar notificaciones al terminar
                </button>
              )}
              {notifPerm === 'granted' && (
                <p className="text-[11px] text-emerald-700/90 dark:text-emerald-300/80">🔔 Notificaciones activas</p>
              )}
              {notifPerm === 'denied' && (
                <p className="text-[11px] text-muted-2">
                  🔕 Notificaciones bloqueadas en el navegador
                </p>
              )}
            </div>
          </div>

          {lastReward && (
            <div className="mt-4 animate-fade-in rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-200">
              🎉 ¡Sesión completada! <strong>+{lastReward.xp} XP</strong> en {lastReward.topic}.
            </div>
          )}
        </Card>

        {/* Stats */}
        <div className="space-y-4">
          <StatBox label="Horas totales" value={stats.totalHours} icon="⏳" accent="cyan" hint="registradas" />
          <StatBox label="Esta semana" value={stats.thisWeek} icon="📆" accent="emerald" hint="sesiones (7 días)" />
          <StatBox label="Duración media" value={formatDuration(stats.avg)} icon="📊" accent="violet" hint="por sesión" />
        </div>
      </div>

      {/* Historial */}
      <Card title="Historial de sesiones" subtitle="Últimas 10" icon="🕑">
        {sessions.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-2">
            Aún no hay sesiones. ¡Inicia el timer para registrar la primera!
          </p>
        ) : (
          <div className="divide-y divide-surface-border/40">
            {sessions.slice(0, 10).map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm text-fg">{s.topicName}</p>
                  <p className="truncate text-[11px] text-muted-2">
                    {s.courseName} · {formatDateTime(s.date)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-xs">
                  <span className="text-muted">{formatDuration(s.duration)}</span>
                  <span className="badge bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">+{s.xp} XP</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
