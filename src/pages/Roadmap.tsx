import { useMemo, useState } from 'react'
import { clsx } from 'clsx'
import { Card, ProgressBar } from '@/components/common'
import { useCourseStore } from '@/store'
import { courseProgress, courseStatus, topicProgress } from '@/utils'
import type { Course, Difficulty } from '@/types'

const difficultyStyles: Record<Difficulty, string> = {
  Easy: 'bg-emerald-500/15 text-emerald-300',
  Medium: 'bg-amber-500/15 text-amber-300',
  Hard: 'bg-rose-500/15 text-rose-300',
}

const statusLabel = {
  'not-started': 'No iniciado',
  'in-progress': 'En progreso',
  completed: 'Completado',
} as const

const statusStyles = {
  'not-started': 'bg-slate-700/60 text-slate-300',
  'in-progress': 'bg-cyan-500/15 text-cyan-300',
  completed: 'bg-emerald-500/15 text-emerald-300',
} as const

function CourseCard({ course }: { course: Course }) {
  const [open, setOpen] = useState(false)
  const incrementTopic = useCourseStore((s) => s.incrementTopic)
  const completeTopic = useCourseStore((s) => s.completeTopic)

  const progress = courseProgress(course)
  const status = courseStatus(progress)
  const totalExercises = course.topics.reduce((s, t) => s + t.exercises, 0)

  return (
    <Card padded={false} className="overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full p-5 text-left transition-colors hover:bg-slate-800/40"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-800 text-xl">
              {course.icon}
            </span>
            <div>
              <h3 className="font-semibold text-slate-100">{course.name}</h3>
              <p className="text-xs text-slate-400">{course.description}</p>
            </div>
          </div>
          <span className={clsx('badge shrink-0', statusStyles[status])}>
            {statusLabel[status]}
          </span>
        </div>
        <div className="mt-4">
          <ProgressBar
            value={progress}
            showValue
            gradient={progress >= 100 ? 'green' : 'accent'}
          />
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>{course.topics.length} temas · {totalExercises} ejercicios</span>
            <span className="text-accent">{open ? 'Ocultar ▲' : 'Ver temas ▼'}</span>
          </div>
        </div>
      </button>

      {open && (
        <div className="animate-fade-in space-y-2 border-t border-surface-border/50 bg-slate-900/40 p-4">
          {course.topics.map((t) => {
            const done = t.completedExercises ?? 0
            const tp = topicProgress(t)
            return (
              <div key={t.id} className="rounded-lg bg-slate-800/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-200">{t.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                      <span className={clsx('badge', difficultyStyles[t.difficulty])}>
                        {t.difficulty}
                      </span>
                      <span className="text-slate-400">{done}/{t.exercises} ejercicios</span>
                      <span className="text-cyan-300">+{t.xp} XP</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => incrementTopic(course.id, t.id, -1)}
                      className="h-7 w-7 rounded-md bg-slate-700/70 text-slate-200 hover:bg-slate-700"
                      aria-label="Restar ejercicio"
                    >
                      −
                    </button>
                    <button
                      onClick={() => incrementTopic(course.id, t.id, 1)}
                      className="h-7 w-7 rounded-md bg-slate-700/70 text-slate-200 hover:bg-slate-700"
                      aria-label="Sumar ejercicio"
                    >
                      +
                    </button>
                    <button
                      onClick={() => completeTopic(course.id, t.id)}
                      className="h-7 rounded-md bg-emerald-500/15 px-2 text-xs text-emerald-300 hover:bg-emerald-500/25"
                    >
                      ✓
                    </button>
                  </div>
                </div>
                <ProgressBar
                  className="mt-2"
                  value={tp}
                  size="sm"
                  gradient={tp >= 100 ? 'green' : 'accent'}
                />
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

export default function Roadmap() {
  const courses = useCourseStore((s) => s.courses)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'not-started' | 'in-progress' | 'completed'>('all')
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | Difficulty>('all')

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const p = courseProgress(c)
      const matchesQuery =
        !query ||
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.topics.some((t) => t.name.toLowerCase().includes(query.toLowerCase()))
      const matchesStatus = statusFilter === 'all' || courseStatus(p) === statusFilter
      const matchesDifficulty =
        difficultyFilter === 'all' ||
        c.topics.some((t) => t.difficulty === difficultyFilter)
      return matchesQuery && matchesStatus && matchesDifficulty
    })
  }, [courses, query, statusFilter, difficultyFilter])

  const totalTopics = courses.reduce((s, c) => s + c.topics.length, 0)
  const totalExercises = courses.reduce(
    (s, c) => s + c.topics.reduce((a, t) => a + t.exercises, 0),
    0,
  )

  return (
    <div className="space-y-6">
      <header className="animate-fade-in">
        <h1 className="text-2xl font-bold text-slate-100 sm:text-3xl">Roadmap académico</h1>
        <p className="text-sm text-slate-400">
          {courses.length} cursos · {totalTopics} temas · {totalExercises} ejercicios
        </p>
      </header>

      <Card padded className="animate-fade-in">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="🔍 Buscar curso o tema…"
            className="w-full rounded-lg border border-surface-border/60 bg-slate-900/60 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-accent focus:outline-none sm:max-w-xs"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="rounded-lg border border-surface-border/60 bg-slate-900/60 px-3 py-2 text-sm text-slate-200 focus:border-accent focus:outline-none"
          >
            <option value="all">Todos los estados</option>
            <option value="not-started">No iniciado</option>
            <option value="in-progress">En progreso</option>
            <option value="completed">Completado</option>
          </select>
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value as typeof difficultyFilter)}
            className="rounded-lg border border-surface-border/60 bg-slate-900/60 px-3 py-2 text-sm text-slate-200 focus:border-accent focus:outline-none"
          >
            <option value="all">Toda dificultad</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {filtered.map((c) => (
          <CourseCard key={c.id} course={c} />
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="py-10 text-center text-sm text-slate-500">
          No hay cursos que coincidan con los filtros.
        </p>
      )}
    </div>
  )
}
