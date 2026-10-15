import { describe, it, expect } from 'vitest'
import type { Course, Topic } from '@/types'
import { studyFocus, topicsDone } from './study'

const topic = (id: string, exercises: number, completedExercises = 0): Topic => ({
  id,
  name: id,
  difficulty: 'Easy',
  exercises,
  xp: 50,
  completedExercises,
})
const course = (id: string, topics: Topic[]): Course => ({ id, name: id, icon: '📚', description: '', progress: 0, topics })

describe('studyFocus', () => {
  it('elige el tema a medias más cerca de terminarse', () => {
    const a = course('a', [topic('a1', 10, 2), topic('a2', 4)])
    const b = course('b', [topic('b1', 4, 3), topic('b2', 4, 4), topic('b3', 5)])
    const f = studyFocus([a, b])!
    expect(f.topic.id).toBe('b1')
    expect(f.number).toBe(1)
    // El siguiente salta los temas ya terminados.
    expect(f.next?.id).toBe('b3')
  })

  it('sin temas a medias, toma el primero sin terminar', () => {
    const a = course('a', [topic('a1', 3, 3), topic('a2', 4)])
    const f = studyFocus([a])!
    expect(f.topic.id).toBe('a2')
    expect(f.number).toBe(2)
    expect(f.next).toBeUndefined()
  })

  it('null si todo está completo', () => {
    expect(studyFocus([course('a', [topic('a1', 2, 2)])])).toBeNull()
  })
})

describe('topicsDone', () => {
  it('cuenta los temas terminados', () => {
    expect(topicsDone(course('a', [topic('a1', 2, 2), topic('a2', 2, 1)]))).toBe(1)
  })
})
