export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  xp: number
  /** Optional hint used to auto-check unlock conditions in the store. */
  condition?:
    | 'level-10'
    | 'plan-first-client'
    | 'plan-90-complete'
    | 'review-1'
    | 'review-4'
}

export interface AchievementState extends Achievement {
  unlocked: boolean
  unlockedAt?: string
}
