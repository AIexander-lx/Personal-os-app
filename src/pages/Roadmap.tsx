import { useMemo, useState } from 'react'
import { clsx } from 'clsx'
import { Card, ProgressBar } from '@/components/common'
import { GRADE_LABEL } from '@/components/MonthlyGoals'
import { useCourseStore, useGoalsStore } from '@/store'
import { courseProgress, courseStatus, gradeStatus, studyFocus, topicProgress, topicsDone } from '@/utils'
import type { Course, Difficulty, Topic } from '@/types'

const DIFFICULTIES: Difficulty[] = ['Easy', 'Medium', 'Hard']

const difficultyStyles: Record<Difficulty, string> = {
  Easy: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  Medium: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  Hard: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
}

const statusLabel = {
  'not-started': 'No iniciado',
  'in-progress': 'En progreso',
  completed: 'Completado',
} as const

const statusStyles = {
  'not-started': 'bg-control/60 text-fg-soft',
  'in-progress': 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300',
  completed: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
} as const

const inputCls =
  'rounded-md border border-surface-border/60 bg-input/60 px-2 py-1 text-sm text-fg focus:border-accent focus:outline-none'

function TopicEditRow({ courseId, topic }: { courseId: string; topic: Topic }) {
  const updateTopic = useCourseStore((s) => s.updateTopic)
  const removeTopic = useCourseStore((s) => s.removeTopic)
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-elevated/40 p-2">
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
      <label className="flex items-center gap-1 text-[11px] text-muted">
        ej.
        <input
          type="number"
          min={0}
          value={topic.exercises}
          onChange={(e) => updateTopic(courseId, topic.id, { exercises: Math.max(0, Number(e.target.value)) })}
          className={clsx(inputCls, 'w-14')}
        />
      </label>
      <label className="flex items-center gap-1 text-[11px] text-muted">
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
        className="ml-auto text-muted-2 hover:text-rose-600 dark:hover:text-rose-400"
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

/** Colores de los íconos de curso, rotando por posición. */
const TILE_COLORS = [
  'bg-cyan-500/15',
  'bg-violet-500/15',
  'bg-rose-500/15',
  'bg-amber-500/15',
  'bg-emerald-500/15',
  'bg-sky-500/15',
]

function CourseTile({
  course,
  color,
  selected,
  onSelect,
}: {
  course: Course
  color: string
  selected: boolean
  onSelect: () => void
}) {
  const evaluations = useGoalsStore((s) => s.evaluations[course.id])
  const passingGrade = useGoalsStore((s) => s.passingGrade)
  const grade = gradeStatus(evaluations ?? [], passingGrade)
  const progress = courseProgress(course)
  const totalExercises = course.topics.reduce((s, t) => s + t.exercises, 0)

  return (
    <button
      onClick={onSelect}
      aria-pressed={selected}
      className={clsx(
        'card-surface flex flex-col p-4 text-left transition-colors animate-fade-in',
        selected ? 'border-accent/60 ring-1 ring-accent/40' : 'hover:border-accent/40',
      )}
    >
      <div className="flex items-start gap-3">
        <span className={clsx('grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl', color)}>{course.icon}</span>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-semibold leading-tight text-fg">{course.name}</p>
          <p className="mt-0.5 text-[11px] text-muted">
            {topicsDone(course)}/{course.topics.length} temas · {totalExercises} ejercicios
          </p>
        </div>
      </div>
      <div className="mt-auto pt-4">
        <div className="mb-1 flex items-center justify-between text-xs">
          {grade.state !== 'sin-datos' ? (
            <span className={clsx('badge text-[10px]', GRADE_LABEL[grade.state].className)}>
              {GRADE_LABEL[grade.state].text}
              {grade.average != null && ` · ${grade.average.toFixed(1)}`}
            </span>
          ) : (
            <span className="text-[11px] text-muted-2">Sin notas</span>
          )}
          <span className="font-mono font-semibold text-fg">{Math.round(progress)}%</span>
        </div>
        <ProgressBar value={progress} size="sm" gradient={progress >= 100 ? 'green' : 'accent'} />
      </div>
    </button>
  )
}

/** Temas del curso seleccionado: avance por ejercicios y edición. */
function CourseDetail({ course, onRemoved }: { course: Course; onRemoved: () => void }) {
  const [editing, setEditing] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const incrementTopic = useCourseStore((s) => s.incrementTopic)
  const completeTopic = useCourseStore((s) => s.completeTopic)
  const updateCourse = useCourseStore((s) => s.updateCourse)
  const removeCourse = useCourseStore((s) => s.removeCourse)

  const progress = courseProgress(course)
  const status = courseStatus(progress)

  return (
    <Card
      id="curso"
      className="scroll-mt-20"
      icon={course.icon}
      title={course.name}
      subtitle={course.description || `${course.topics.length} temas`}
      action={
        <div className="flex shrink-0 items-center gap-2">
          <span className={clsx('badge', statusStyles[status])}>{statusLabel[status]}</span>
          <button
            onClick={() => {
              setEditing((v) => !v)
              setConfirmDel(false)
            }}
            className={clsx(
              'badge transition-colors',
              editing ? 'bg-accent/20 text-accent' : 'bg-control/60 text-fg-soft hover:text-accent',
            )}
          >
            {editing ? '✓ Listo' : '✏️ Editar'}
          </button>
        </div>
      }
    >
      <ProgressBar value={progress} showValue gradient={progress >= 100 ? 'green' : 'accent'} />

      {editing && (
        <div className="mt-4 space-y-2 rounded-lg border border-accent/20 bg-elevated/40 p-3">
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
                onClick={() => {
                  removeCourse(course.id)
                  onRemoved()
                }}
                className="flex-1 rounded-md bg-rose-500/15 px-2 py-1.5 text-xs font-medium text-rose-700 dark:text-rose-300 hover:bg-rose-500/25"
              >
                Sí, eliminar curso
              </button>
              <button
                onClick={() => setConfirmDel(false)}
                className="rounded-md bg-elevated px-3 py-1.5 text-xs text-fg-soft hover:bg-control"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDel(true)}
              className="text-xs text-muted hover:text-rose-700 dark:hover:text-rose-300"
            >
              🗑 Eliminar curso
            </button>
          )}
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
        {course.topics.map((t, i) => {
          if (editing) return <TopicEditRow key={t.id} courseId={course.id} topic={t} />
          const done = t.completedExercises ?? 0
          const tp = topicProgress(t)
          return (
            <div key={t.id} className="rounded-lg bg-elevated/40 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-fg">
                    <span className="mr-1.5 font-mono text-xs text-muted-2">{i + 1}.</span>
                    {t.name}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                    <span className={clsx('badge', difficultyStyles[t.difficulty])}>{t.difficulty}</span>
                    <span className="text-muted">
                      {done}/{t.exercises} ejercicios
                    </span>
                    <span className="text-cyan-700 dark:text-cyan-300">+{t.xp} XP</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => incrementTopic(course.id, t.id, -1)}
                    className="h-7 w-7 rounded-md bg-control/70 text-fg hover:bg-control"
                    aria-label="Restar ejercicio"
                  >
                    −
                  </button>
                  <button
                    onClick={() => incrementTopic(course.id, t.id, 1)}
                    className="h-7 w-7 rounded-md bg-control/70 text-fg hover:bg-control"
                    aria-label="Sumar ejercicio"
                  >
                    +
                  </button>
                  <button
                    onClick={() => completeTopic(course.id, t.id)}
                    className="h-7 rounded-md bg-emerald-500/15 px-2 text-xs text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25"
                    aria-label="Completar tema"
                  >
                    ✓
                  </button>
                </div>
              </div>
              <ProgressBar className="mt-2" value={tp} size="sm" gradient={tp >= 100 ? 'green' : 'accent'} />
            </div>
          )
        })}
      </div>

      {editing && (
        <div className="mt-2">
          <AddTopicForm courseId={course.id} />
        </div>
      )}
      {!editing && course.topics.length === 0 && (
        <p className="py-3 text-center text-xs text-muted-2">Sin temas. Pulsa ✏️ Editar para agregar.</p>
      )}
    </Card>
  )
}

/** Tema a medias más cercano a terminarse, y el que sigue. */
function TopicFocus({ onContinue }: { onContinue: (courseId: string) => void }) {
  const courses = useCourseStore((s) => s.courses)
  const focus = studyFocus(courses)

  if (!focus) {
    return (
      <Card className="lg:col-span-3" icon="🏆" title="Todos los temas completos">
        <p className="text-sm text-muted">Terminaste todos los ejercicios del ciclo. ¡A rendir esos exámenes!</p>
      </Card>
    )
  }

  const { course, topic, number, next } = focus
  const done = topic.completedExercises ?? 0
  const started = done > 0

  return (
    <>
      <Card className="lg:col-span-2" icon="📌" title={started ? 'Tema en progreso' : 'Siguiente tema'}>
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-accent/30 bg-accent/5 p-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent/15 text-2xl">{course.icon}</span>
          <div className="min-w-[12rem] flex-1">
            <p className="text-[11px] uppercase tracking-wider text-muted">
              {course.name} · Tema {number}
            </p>
            <p className="font-semibold text-fg">{topic.name}</p>
            <ProgressBar className="mt-2" value={topicProgress(topic)} size="sm" gradient="accent" />
            <p className="mt-1 text-[11px] text-muted">
              {done}/{topic.exercises} ejercicios completados · +{topic.xp} XP
            </p>
          </div>
          <button
            onClick={() => onContinue(course.id)}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-surface transition-opacity hover:opacity-90"
          >
            {started ? 'Continuar' : 'Empezar'}
          </button>
        </div>
      </Card>

      <Card icon="⏭️" title="Próximo tema">
        {next ? (
          <div className="flex items-center gap-3">
            <span className={clsx('badge', difficultyStyles[next.difficulty])}>{next.difficulty}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-fg">{next.name}</p>
              <p className="text-[11px] text-muted">
                {course.name} · {next.exercises} ejercicios
              </p>
            </div>
            <span className="font-mono text-sm font-semibold text-accent">+{next.xp} XP</span>
          </div>
        ) : (
          <p className="text-sm text-muted">Es el último tema pendiente de {course.name}.</p>
        )}
      </Card>
    </>
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
            className="rounded-lg bg-elevated px-3 py-2 text-sm text-fg-soft hover:bg-control"
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
  const [selectedId, setSelectedId] = useState<string | null>(null)

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

  const selected = courses.find((c) => c.id === selectedId)
  const totalTopics = courses.reduce((s, c) => s + c.topics.length, 0)
  const doneTopics = courses.reduce((s, c) => s + topicsDone(c), 0)
  const totalExercises = courses.reduce((s, c) => s + c.topics.reduce((a, t) => a + t.exercises, 0), 0)
  const avgProgress = courses.length ? courses.reduce((s, c) => s + courseProgress(c), 0) / courses.length : 0

  const openCourse = (id: string) => {
    setSelectedId(id)
    // Espera al render del detalle antes de bajar hasta él.
    requestAnimationFrame(() => document.getElementById('curso')?.scrollIntoView({ behavior: 'smooth' }))
  }

  const selectCls =
    'rounded-lg border border-surface-border/60 bg-input/60 px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none'

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-fg sm:text-3xl">Roadmap · Cursos</h1>
          <p className="text-sm text-muted">
            {courses.length} cursos · {doneTopics}/{totalTopics} temas · {totalExercises} ejercicios · {Math.round(avgProgress)}% del ciclo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge bg-control/60 text-fg-soft">Ciclo 4 · UTEC</span>
          <button
            onClick={() => setAdding((v) => !v)}
            className="rounded-lg bg-accent/15 px-3 py-2 text-sm font-medium text-accent hover:bg-accent/25"
          >
            ➕ Nuevo curso
          </button>
          <button
            onClick={() => resetCourses()}
            className="rounded-lg border border-surface-border/60 px-3 py-2 text-xs text-muted hover:text-rose-700 dark:hover:text-rose-300"
            title="Restaurar los cursos originales de UTEC"
          >
            ↺ Restaurar
          </button>
        </div>
      </header>

      {adding && <AddCourseForm onDone={() => setAdding(false)} />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍 Buscar curso o tema…"
          className="w-full rounded-lg border border-surface-border/60 bg-input/60 px-3 py-2 text-sm text-fg placeholder:text-muted-2 focus:border-accent focus:outline-none sm:max-w-xs"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className={selectCls}>
          <option value="all">Todos los estados</option>
          <option value="not-started">No iniciado</option>
          <option value="in-progress">En progreso</option>
          <option value="completed">Completado</option>
        </select>
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value as typeof difficultyFilter)}
          className={selectCls}
        >
          <option value="all">Toda dificultad</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <CourseTile
            key={c.id}
            course={c}
            color={TILE_COLORS[courses.indexOf(c) % TILE_COLORS.length]}
            selected={c.id === selectedId}
            onSelect={() => (c.id === selectedId ? setSelectedId(null) : openCourse(c.id))}
          />
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-2">No hay cursos que coincidan con los filtros.</p>
      )}

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <TopicFocus onContinue={openCourse} />
      </section>

      {selected ? (
        <CourseDetail key={selected.id} course={selected} onRemoved={() => setSelectedId(null)} />
      ) : (
        <p className="text-center text-xs text-muted-2">Toca un curso para ver sus temas y registrar ejercicios.</p>
      )}
    </div>
  )
}
