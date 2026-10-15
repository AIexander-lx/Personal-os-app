import { describe, it, expect } from 'vitest'
import {
  getLevelInfo,
  levelProgress,
  xpToNextLevel,
  topicProgress,
  courseProgress,
  courseStatus,
} from './gamification'
import type { Course, Topic } from '@/types'

const topic = (over: Partial<Topic> = {}): Topic => ({
  id: 't',
  name: 'Tema',
  difficulty: 'Medium',
  exercises: 8,
  xp: 80,
  completedExercises: 0,
  ...over,
})

const course = (topics: Topic[], progress = 0): Course => ({
  id: 'c',
  name: 'Curso',
  icon: '📚',
  description: '',
  progress,
  topics,
})

describe('getLevelInfo', () => {
  it('0 XP es nivel 1 (Beginner)', () => {
    const l = getLevelInfo(0)
    expect(l.level).toBe(1)
    expect(l.title).toBe('Beginner')
  })

  it('1250 XP es nivel 3 (Developer)', () => {
    expect(getLevelInfo(1250).level).toBe(3)
    expect(getLevelInfo(1250).title).toBe('Developer')
  })

  it('el límite inferior de un nivel pertenece a ese nivel', () => {
    expect(getLevelInfo(500).level).toBe(2)
    expect(getLevelInfo(2500).level).toBe(6)
  })

  it('4500+ XP es nivel 10 (Master Architect), sin techo', () => {
    expect(getLevelInfo(4500).level).toBe(10)
    expect(getLevelInfo(999999).level).toBe(10)
  })
})

describe('levelProgress', () => {
  it('0% al inicio de un nivel', () => {
    expect(levelProgress(0)).toBe(0)
    expect(levelProgress(1000)).toBe(0)
  })

  it('50% a mitad del nivel', () => {
    expect(levelProgress(250)).toBe(50) // nivel 1: 0-500
  })

  it('100% en el nivel máximo', () => {
    expect(levelProgress(5000)).toBe(100)
  })
})

describe('xpToNextLevel', () => {
  it('500 desde 0', () => {
    expect(xpToNextLevel(0)).toBe(500)
  })

  it('250 desde 1250', () => {
    expect(xpToNextLevel(1250)).toBe(250)
  })

  it('0 en el nivel máximo', () => {
    expect(xpToNextLevel(5000)).toBe(0)
  })
})

describe('topicProgress', () => {
  it('mitad de ejercicios → 50%', () => {
    expect(topicProgress(topic({ exercises: 8, completedExercises: 4 }))).toBe(50)
  })

  it('sin ejercicios → 0%', () => {
    expect(topicProgress(topic({ exercises: 0, completedExercises: 0 }))).toBe(0)
  })

  it('todos completados → 100%', () => {
    expect(topicProgress(topic({ exercises: 5, completedExercises: 5 }))).toBe(100)
  })
})

describe('courseProgress', () => {
  it('promedia ponderado por ejercicios completados', () => {
    const c = course([
      topic({ id: 'a', exercises: 10, completedExercises: 5 }),
      topic({ id: 'b', exercises: 10, completedExercises: 10 }),
    ])
    expect(courseProgress(c)).toBe(75) // 15/20
  })

  it('curso vacío usa el progress semilla como fallback', () => {
    expect(courseProgress(course([], 42))).toBe(42)
  })

  it('todos los temas completos → 100%', () => {
    const c = course([topic({ exercises: 4, completedExercises: 4 })])
    expect(courseProgress(c)).toBe(100)
  })
})

describe('courseStatus', () => {
  it('0 → not-started', () => {
    expect(courseStatus(0)).toBe('not-started')
  })
  it('intermedio → in-progress', () => {
    expect(courseStatus(50)).toBe('in-progress')
  })
  it('100 → completed', () => {
    expect(courseStatus(100)).toBe('completed')
  })
})
