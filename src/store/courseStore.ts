import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Course, Topic } from '@/types'
import { courses as seedCourses } from '@/data/courses'
import { courseProgress, courseStatus } from '@/utils'

interface CourseState {
  courses: Course[]
  /** Marca (o desmarca) un ejercicio completado en un tema. */
  setTopicExercises: (courseId: string, topicId: string, completed: number) => void
  incrementTopic: (courseId: string, topicId: string, delta: number) => void
  completeTopic: (courseId: string, topicId: string) => void
  // --- Edición del catálogo ---
  addCourse: (input: Pick<Course, 'name' | 'icon' | 'description'>) => void
  updateCourse: (courseId: string, patch: Partial<Pick<Course, 'name' | 'icon' | 'description'>>) => void
  removeCourse: (courseId: string) => void
  addTopic: (courseId: string, input: Omit<Topic, 'id' | 'completedExercises'>) => void
  updateTopic: (courseId: string, topicId: string, patch: Partial<Omit<Topic, 'id'>>) => void
  removeTopic: (courseId: string, topicId: string) => void
  getCourse: (courseId: string) => Course | undefined
  progressOf: (courseId: string) => number
  statusOf: (courseId: string) => 'not-started' | 'in-progress' | 'completed'
  resetCourses: () => void
}

/** Deriva completedExercises inicial a partir del `progress` semilla. */
function seedWithProgress(courses: Course[]): Course[] {
  return courses.map((c) => ({
    ...c,
    topics: c.topics.map((t) => ({
      ...t,
      completedExercises:
        t.completedExercises ?? Math.round((c.progress / 100) * t.exercises),
    })),
  }))
}

export const useCourseStore = create<CourseState>()(
  persist(
    (set, get) => ({
      courses: seedWithProgress(seedCourses),

      setTopicExercises: (courseId, topicId, completed) =>
        set((state) => ({
          courses: state.courses.map((c) =>
            c.id !== courseId
              ? c
              : {
                  ...c,
                  topics: c.topics.map((t) =>
                    t.id !== topicId
                      ? t
                      : {
                          ...t,
                          completedExercises: Math.max(
                            0,
                            Math.min(t.exercises, completed),
                          ),
                        },
                  ),
                },
          ),
        })),

      incrementTopic: (courseId, topicId, delta) => {
        const course = get().courses.find((c) => c.id === courseId)
        const topic = course?.topics.find((t) => t.id === topicId)
        if (!topic) return
        get().setTopicExercises(
          courseId,
          topicId,
          (topic.completedExercises ?? 0) + delta,
        )
      },

      completeTopic: (courseId, topicId) => {
        const course = get().courses.find((c) => c.id === courseId)
        const topic = course?.topics.find((t) => t.id === topicId)
        if (!topic) return
        get().setTopicExercises(courseId, topicId, topic.exercises)
      },

      addCourse: (input) =>
        set((state) => ({
          courses: [
            ...state.courses,
            {
              id: `course_${Date.now()}`,
              name: input.name,
              icon: input.icon || '📚',
              description: input.description,
              progress: 0,
              topics: [],
            },
          ],
        })),

      updateCourse: (courseId, patch) =>
        set((state) => ({
          courses: state.courses.map((c) => (c.id === courseId ? { ...c, ...patch } : c)),
        })),

      removeCourse: (courseId) =>
        set((state) => ({ courses: state.courses.filter((c) => c.id !== courseId) })),

      addTopic: (courseId, input) =>
        set((state) => ({
          courses: state.courses.map((c) =>
            c.id !== courseId
              ? c
              : {
                  ...c,
                  topics: [
                    ...c.topics,
                    { ...input, id: `topic_${Date.now()}`, completedExercises: 0 },
                  ],
                },
          ),
        })),

      updateTopic: (courseId, topicId, patch) =>
        set((state) => ({
          courses: state.courses.map((c) =>
            c.id !== courseId
              ? c
              : {
                  ...c,
                  topics: c.topics.map((t) => {
                    if (t.id !== topicId) return t
                    const merged = { ...t, ...patch }
                    // Mantén completedExercises dentro del rango de ejercicios.
                    merged.completedExercises = Math.max(
                      0,
                      Math.min(merged.exercises, merged.completedExercises ?? 0),
                    )
                    return merged
                  }),
                },
          ),
        })),

      removeTopic: (courseId, topicId) =>
        set((state) => ({
          courses: state.courses.map((c) =>
            c.id !== courseId
              ? c
              : { ...c, topics: c.topics.filter((t) => t.id !== topicId) },
          ),
        })),

      getCourse: (courseId) => get().courses.find((c) => c.id === courseId),

      progressOf: (courseId) => {
        const c = get().courses.find((c) => c.id === courseId)
        return c ? courseProgress(c) : 0
      },

      statusOf: (courseId) => {
        const c = get().courses.find((c) => c.id === courseId)
        return c ? courseStatus(courseProgress(c)) : 'not-started'
      },

      resetCourses: () => set({ courses: seedWithProgress(seedCourses) }),
    }),
    { name: 'course-store' },
  ),
)
