import { useMemo, useState } from 'react'
import { clsx } from 'clsx'
import { Card, ProgressBar } from '@/components/common'
import { useCourseStore } from '@/store'
import { courseProgress, courseStatus, topicProgress } from '@/utils'
import type { Course, Difficulty, Topic } from '@/types'

const DIFFICULTIES: Difficulty[] = ['Easy', 'Medium', 'Hard']

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

const inputCls =
  'rounded-md border border-surface-border/60 bg-slate-900/60 px-2 py-1 text-sm text-slate-200 focus:border-accent focus:outline-none'

function TopicEditRow({ courseId, topic }: { courseId: string; topic: Topic }) {
  const updateTopic = useCourseStore((s) => s.updateTopic)
  const removeTopic = useCourseStore((s) => s.removeTopic)
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-800/40 p-2">
      <input
        value={topic.name}
        onChange={(e) => updateTopic(courseId, topic.id, { name: e.target.value })}
        className={clsx(inputCls, 'min-w-[9rem] flex-1')}
        aria-label="Nombre del tema"
      />
      <select
        value={topic.difficulty}
        onChange={(e) => updateTopic(courseId, topic.id, { difficulty: e.target.value as Difficulty })}
        className={inputCls}
        aria-label="Dificultad"
      >
        {DIFFICULTIES.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
      <label className="flex items-center gap-1 text-[11px] text-slate-400">
        ej.
        <input
          type="number"
          min={0}
          value={topic.exercises}
          onChange={(e) => updateTopic(courseId, topic.id, { exercises: Math.max(0, Number(e.target.value)) })}
          className={clsx(inputCls, 'w-14')}
        />
      </label>
      <label className="flex items-center gap-1 text-[11px] text-slate-400">
        XP
        <input
          type="number"
          min={0}
          value={topic.xp}
          onChange={(e) => updateTopic(courseId, topic.id, { xp: Math.max(0, Number(e.target.value)) })}
          className={clsx(inputCls, 'w-16')}
        />
      </label>
      <button
        onClick={() => removeTopic(courseId, topic.id)}
        className="ml-auto text-slate-500 hover:text-rose-400"
        aria-label="Eliminar tema"
      >
        ✕
      </button>
    </div>
  )
}

function AddTopicForm({ courseId }: { courseId: string }) {
  const addTopic = useCourseStore((s) => s.addTopic)
  const [name, setName] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium')
  const [exercises, setExercises] = useState(5)
  const [xp, setXp] = useState(80)

  return (
    <form
      className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-surface-border/60 p-2"
      onSubmit={(e) => {
        e.preventDefault()
        if (!name.trim()) return
        addTopic(courseId, { name: name.trim(), difficulty, exercises, xp })
        setName('')
        setExercises(5)
        setXp(80)
      }}
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nuevo tema…"
        className={clsx(inputCls, 'min-w-[9rem] flex-1')}
      />
      <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} className={inputCls}>
        {DIFFICULTIES.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
      <input
        type="number"
        min={0}
        value={exercises}
        onChange={(e) => setExercises(Math.max(0, Number(e.target.value)))}
        className={clsx(inputCls, 'w-14')}
        aria-label="Ejercicios"
      />
      <input
        type="number"
        min={0}
        value={xp}
        onChange={(e) => setXp(Math.max(0, Number(e.target.value)))}
        className={clsx(inputCls, 'w-16')}
        aria-label="XP"
      />
      <button className="rounded-md bg-accent/15 px-3 py-1 text-sm font-medium text-accent hover:bg-accent/25">
        +
      </button>
    </form>
  )
}

function CourseCard({ course }: { course: Course }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const incrementTopic = useCourseStore((s) => s.incrementTopic)
  const completeTopic = useCourseStore((s) => s.completeTopic)
  const updateCourse = useCourseStore((s) => s.updateCourse)
  const removeCourse = useCourseStore((s) => s.removeCourse)

  const progress = courseProgress(course)
  const status = courseStatus(progress)
  const totalExercises = course.topics.reduce((s, t) => s + t.exercises, 0)
  const expanded = open || editing

  const toggleEdit = () => {
    const nv = !editing
    setEditing(nv)
    setConfirmDel(false)
    if (nv) setOpen(true)
  }

  return (
    <Card padded={false} className="overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex min-w-0 items-center gap-3 text-left"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-800 text-xl">
              {course.icon}
            </span>
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-slate-100">{course.name}</h3>
              <p className="truncate text-xs text-slate-400">{course.description}</p>
            </div>
          </button>
          <div className="flex shrink-0 items-center gap-2">
            <span className={clsx('badge', statusStyles[status])}>{statusLabel[status]}</span>
            <button
              onClick={toggleEdit}
              className={clsx(
                'badge transition-colors',
                editing ? 'bg-accent/20 text-accent' : 'bg-slate-700/60 text-slate-300 hover:text-accent',
              )}
              aria-label="Editar curso"
            >
              {editing ? '✓' : '✏️'}
            </button>
          </div>
        </div>

        <div className="mt-4">
          <ProgressBar value={progress} showValue gradient={progress >= 100 ? 'green' : 'accent'} />
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>
              {course.topics.length} temas · {totalExercises} ejercicios
            </span>
            <button onClick={() => setOpen((v) => !v)} className="text-accent">
              {expanded ? 'Ocultar ▲' : 'Ver temas ▼'}
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="animate-fade-in space-y-2 border-t border-surface-border/50 bg-slate-900/40 p-4">
          {editing && (
            <div className="space-y-2 rounded-lg border border-accent/20 bg-slate-800/40 p-3">
              <div className="flex gap-2">
                <input
                  value={course.icon}
                  onChange={(e) => updateCourse(course.id, { icon: e.target.value })}
                  className={clsx(inputCls, 'w-12 text-center')}
                  aria-label="Icono del curso"
                />
                <input
                  value={course.name}
                  onChange={(e) => updateCourse(course.id, { name: e.target.value })}
                  className={clsx(inputCls, 'flex-1')}
                  aria-label="Nombre del curso"
                />
              </div>
              <input
                value={course.description}
                onChange={(e) => updateCourse(course.id, { description: e.target.value })}
                className={clsx(inputCls, 'w-full')}
                aria-label="Descripción del curso"
                placeholder="Descripción"
              />
              {confirmDel ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => removeCourse(course.id)}
                    className="flex-1 rounded-md bg-rose-500/15 px-2 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/25"
                  >
                    Sí, eliminar curso
                  </button>
                  <button
                    onClick={() => setConfirmDel(false)}
                    className="rounded-md bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDel(true)}
                  className="text-xs text-slate-400 hover:text-rose-300"
                >
                  🗑 Eliminar curso
                </button>
              )}
            </div>
          )}

          {course.topics.map((t) => {
            if (editing) return <TopicEditRow key={t.id} courseId={course.id} topic={t} />
            const done = t.completedExercises ?? 0
            const tp = topicProgress(t)
            return (
              <div key={t.id} className="rounded-lg bg-slate-800/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-200">{t.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                      <span className={clsx('badge', difficultyStyles[t.difficulty])}>{t.difficulty}</span>
                      <span className="text-slate-400">
                        {done}/{t.exercises} ejercicios
                      </span>
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
                <ProgressBar className="mt-2" value={tp} size="sm" gradient={tp >= 100 ? 'green' : 'accent'} />
              </div>
            )
          })}

          {editing && <AddTopicForm courseId={course.id} />}
          {!editing && course.topics.length === 0 && (
            <p className="py-3 text-center text-xs text-slate-500">
              Sin temas. Pulsa ✏️ para agregar.
            </p>
          )}
        </div>
      )}
    </Card>
  )
}

function AddCourseForm({ onDone }: { onDone: () => void }) {
  const addCourse = useCourseStore((s) => s.addCourse)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('📚')
  const [description, setDescription] = useState('')

  return (
    <Card className="animate-fade-in" title="Nuevo curso" icon="➕">
      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
        onSubmit={(e) => {
          e.preventDefault()
          if (!name.trim()) return
          addCourse({ name: name.trim(), icon: icon || '📚', description: description.trim() })
          onDone()
        }}
      >
        <input
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          className={clsx(inputCls, 'w-14 text-center')}
          aria-label="Icono"
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del curso"
          className={clsx(inputCls, 'sm:w-56')}
          autoFocus
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción (opcional)"
          className={clsx(inputCls, 'flex-1')}
        />
        <div className="flex gap-2">
          <button className="rounded-lg bg-accent/15 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/25">
            Crear
          </button>
          <button
            type="button"
            onClick={onDone}
            className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700"
          >
            Cancelar
          </button>
        </div>
      </form>
    </Card>
  )
}

export default function Roadmap() {
  const courses = useCourseStore((s) => s.courses)
  const resetCourses = useCourseStore((s) => s.resetCourses)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'not-started' | 'in-progress' | 'completed'>('all')
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | Difficulty>('all')
  const [adding, setAdding] = useState(false)

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const p = courseProgress(c)
      const matchesQuery =
        !query ||
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.topics.some((t) => t.name.toLowerCase().includes(query.toLowerCase()))
      const matchesStatus = statusFilter === 'all' || courseStatus(p) === statusFilter
      const matchesDifficulty =
        difficultyFilter === 'all' || c.topics.some((t) => t.difficulty === difficultyFilter)
      return matchesQuery && matchesStatus && matchesDifficulty
    })
  }, [courses, query, statusFilter, difficultyFilter])

  const totalTopics = courses.reduce((s, c) => s + c.topics.length, 0)
  const totalExercises = courses.reduce((s, c) => s + c.topics.reduce((a, t) => a + t.exercises, 0), 0)

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 sm:text-3xl">Roadmap académico</h1>
          <p className="text-sm text-slate-400">
            {courses.length} cursos · {totalTopics} temas · {totalExercises} ejercicios
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setAdding((v) => !v)}
            className="rounded-lg bg-accent/15 px-3 py-2 text-sm font-medium text-accent hover:bg-accent/25"
          >
            ➕ Nuevo curso
          </button>
          <button
            onClick={() => resetCourses()}
            className="rounded-lg border border-surface-border/60 px-3 py-2 text-xs text-slate-400 hover:text-rose-300"
            title="Restaurar los cursos originales de UTEC"
          >
            ↺ Restaurar
          </button>
        </div>
      </header>

      {adding && <AddCourseForm onDone={() => setAdding(false)} />}

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
