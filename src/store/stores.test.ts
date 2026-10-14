import { describe, it, expect, beforeEach } from 'vitest'
import { useUserStore } from './userStore'
import { useCourseStore } from './courseStore'
import { useGamificationStore } from './gamificationStore'
import { useScheduleStore } from './scheduleStore'
import { todayKey } from '@/utils'

beforeEach(() => {
  localStorage.clear()
  useUserStore.getState().resetAll()
  useCourseStore.getState().resetCourses()
  useGamificationStore.getState().resetAchievements()
  useScheduleStore.getState().resetSchedule()
})

describe('userStore.addSession', () => {
  it('crea la sesión con XP correcto y actualiza al usuario', () => {
    const session = useUserStore.getState().addSession({
      courseId: 'c',
      courseName: 'Curso',
      topicId: 't',
      topicName: 'Tema',
      duration: 45,
    })
    expect(session.xp).toBe(73)

    const { user, sessions } = useUserStore.getState()
    expect(user.totalXP).toBe(73)
    expect(user.sessions).toBe(1)
    expect(sessions).toHaveLength(1)
    expect(sessions[0].topicName).toBe('Tema')
  })
})

describe('userStore.addXP', () => {
  it('registra el movimiento real de XP en el historial', () => {
    useUserStore.getState().addXP(40)
    useUserStore.getState().addXP(-100) // se topa en 0: solo baja 40
    const { user, xpLog } = useUserStore.getState()
    expect(user.totalXP).toBe(0)
    expect(xpLog.map((e) => e.xp)).toEqual([40, -40])
  })

  it('no registra cambios de 0', () => {
    useUserStore.getState().addXP(-10)
    expect(useUserStore.getState().xpLog).toHaveLength(0)
  })
})

describe('gamificationStore.evaluate', () => {
  it('desbloquea "First Session" tras la primera sesión y suma su bono', () => {
    useUserStore.getState().addSession({
      courseId: 'c',
      courseName: 'Curso',
      topicId: 't',
      topicName: 'Tema',
      duration: 25, // 63 XP
    })
    const xpAfterSession = useUserStore.getState().user.totalXP

    const newly = useGamificationStore.getState().evaluate()
    expect(newly.some((a) => a.id === 'ach_1')).toBe(true)
    // First Session da +100 XP.
    expect(useUserStore.getState().user.totalXP).toBe(xpAfterSession + 100)
  })

  it('no vuelve a desbloquear un logro ya obtenido', () => {
    useUserStore.getState().addSession({
      courseId: 'c', courseName: 'C', topicId: 't', topicName: 'T', duration: 25,
    })
    useGamificationStore.getState().evaluate()
    const second = useGamificationStore.getState().evaluate()
    expect(second.some((a) => a.id === 'ach_1')).toBe(false)
  })

  it('GitHub Hero se desbloquea con 50 commits', () => {
    useUserStore.getState().setGithubCommits(50)
    const newly = useGamificationStore.getState().evaluate()
    expect(newly.some((a) => a.id === 'ach_9')).toBe(true)
  })

  it('Community Builder se desbloquea con 5 compañeros', () => {
    useUserStore.getState().setPeersHelped(5)
    const newly = useGamificationStore.getState().evaluate()
    expect(newly.some((a) => a.id === 'ach_10')).toBe(true)
  })

  it('Perfect Day requiere gym + estudio + salud el mismo día', () => {
    const today = todayKey()
    useUserStore.getState().addSession({
      courseId: 'c', courseName: 'C', topicId: 't', topicName: 'T', duration: 30,
    })
    // Solo estudio: aún no.
    expect(useGamificationStore.getState().evaluate().some((a) => a.id === 'ach_4')).toBe(false)

    useUserStore.getState().toggleGym(today)
    useUserStore.getState().logEnergy(today, 8)
    const newly = useGamificationStore.getState().evaluate()
    expect(newly.some((a) => a.id === 'ach_4')).toBe(true)
  })

  it("All A's se desbloquea al completar los 6 cursos", () => {
    const cs = useCourseStore.getState()
    cs.courses.forEach((c) => c.topics.forEach((t) => cs.completeTopic(c.id, t.id)))
    const newly = useGamificationStore.getState().evaluate()
    expect(newly.some((a) => a.id === 'ach_8')).toBe(true)
  })
})

describe('courseStore CRUD', () => {
  it('agrega un curso con icono por defecto cuando viene vacío', () => {
    const before = useCourseStore.getState().courses.length
    useCourseStore.getState().addCourse({ name: 'Nuevo', icon: '', description: 'd' })
    const courses = useCourseStore.getState().courses
    expect(courses).toHaveLength(before + 1)
    expect(courses[courses.length - 1].icon).toBe('📚')
  })

  it('agrega, actualiza (con clamp) y elimina temas', () => {
    useCourseStore.getState().addCourse({ name: 'X', icon: '🧪', description: '' })
    const courseId = useCourseStore.getState().courses.at(-1)!.id

    useCourseStore.getState().addTopic(courseId, {
      name: 'Tema', difficulty: 'Easy', exercises: 3, xp: 50,
    })
    let course = useCourseStore.getState().courses.find((c) => c.id === courseId)!
    const topicId = course.topics[0].id
    expect(course.topics).toHaveLength(1)

    // Completa 3/3 y luego reduce ejercicios a 2 → completedExercises se ajusta a 2.
    useCourseStore.getState().setTopicExercises(courseId, topicId, 3)
    useCourseStore.getState().updateTopic(courseId, topicId, { exercises: 2 })
    course = useCourseStore.getState().courses.find((c) => c.id === courseId)!
    expect(course.topics[0].exercises).toBe(2)
    expect(course.topics[0].completedExercises).toBe(2)

    useCourseStore.getState().removeTopic(courseId, topicId)
    course = useCourseStore.getState().courses.find((c) => c.id === courseId)!
    expect(course.topics).toHaveLength(0)

    const countBefore = useCourseStore.getState().courses.length
    useCourseStore.getState().removeCourse(courseId)
    expect(useCourseStore.getState().courses).toHaveLength(countBefore - 1)
  })

  it('incrementTopic respeta los límites [0, exercises]', () => {
    const course = useCourseStore.getState().courses[0]
    const topic = course.topics[0]
    useCourseStore.getState().setTopicExercises(course.id, topic.id, 0)
    useCourseStore.getState().incrementTopic(course.id, topic.id, -5)
    let t = useCourseStore.getState().courses[0].topics[0]
    expect(t.completedExercises).toBe(0)

    useCourseStore.getState().incrementTopic(course.id, topic.id, topic.exercises + 10)
    t = useCourseStore.getState().courses[0].topics[0]
    expect(t.completedExercises).toBe(topic.exercises)
  })
})

describe('scheduleStore CRUD', () => {
  it('agrega, actualiza y elimina bloques', () => {
    const n = useScheduleStore.getState().blocks.length
    useScheduleStore.getState().addBlock({ label: 'B', icon: '⏳', start: '21:00', end: '21:30' })
    expect(useScheduleStore.getState().blocks).toHaveLength(n + 1)

    const block = useScheduleStore.getState().blocks.at(-1)!
    useScheduleStore.getState().updateBlock(block.id, { label: 'Meditación' })
    expect(useScheduleStore.getState().blocks.find((b) => b.id === block.id)!.label).toBe('Meditación')

    useScheduleStore.getState().removeBlock(block.id)
    expect(useScheduleStore.getState().blocks).toHaveLength(n)
  })
})
