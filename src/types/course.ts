export type Difficulty = 'Easy' | 'Medium' | 'Hard'

export type CourseStatus = 'not-started' | 'in-progress' | 'completed'

export interface Topic {
  id: string
  name: string
  difficulty: Difficulty
  exercises: number
  xp: number
  /** Number of exercises the user has completed for this topic. */
  completedExercises?: number
}

export interface Course {
  id: string
  name: string
  icon: string
  description: string
  /** Fallback/seed progress (0-100). Live progress is derived from topics. */
  progress: number
  topics: Topic[]
}
