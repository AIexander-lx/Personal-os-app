import type { Course, Topic } from '@/types'

const isDone = (t: Topic) => (t.completedExercises ?? 0) >= t.exercises
const isStarted = (t: Topic) => (t.completedExercises ?? 0) > 0

export interface StudyFocus {
  course: Course
  topic: Topic
  /** Posición del tema en el curso (1 = primero). */
  number: number
  /** Siguiente tema sin terminar del mismo curso, si hay. */
  next?: Topic
}

/**
 * Tema en el que conviene seguir: el empezado que está más cerca de
 * terminarse; si no hay ninguno a medias, el primer tema sin terminar.
 * null si todo está completo.
 */
export function studyFocus(courses: Course[]): StudyFocus | null {
  let best: { course: Course; topic: Topic; ratio: number } | null = null
  for (const course of courses) {
    for (const topic of course.topics) {
      if (!isStarted(topic) || isDone(topic) || !topic.exercises) continue
      const ratio = (topic.completedExercises ?? 0) / topic.exercises
      if (!best || ratio > best.ratio) best = { course, topic, ratio }
    }
  }

  let pick: { course: Course; topic: Topic } | null = best
  if (!pick) {
    for (const course of courses) {
      const topic = course.topics.find((t) => !isDone(t))
      if (topic) {
        pick = { course, topic }
        break
      }
    }
  }
  if (!pick) return null

  const index = pick.course.topics.indexOf(pick.topic)
  const next = pick.course.topics.slice(index + 1).find((t) => !isDone(t))
  return { course: pick.course, topic: pick.topic, number: index + 1, next }
}

/** Temas terminados de un curso. */
export function topicsDone(course: Course): number {
  return course.topics.filter(isDone).length
}
