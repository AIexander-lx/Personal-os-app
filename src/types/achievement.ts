export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  xp: number
  /** Optional hint used to auto-check unlock conditions in the store. */
  condition?:
    | 'first-session'
    | 'streak-7'
    | 'hours-100'
    | 'level-10'
    | 'streak-30'
}

export interface AchievementState extends Achievement {
  unlocked: boolean
  unlockedAt?: string
}
