import type { Achievement } from '@/types'

export const achievements: Achievement[] = [
  { id: 'ach_1', name: 'First Session', description: 'Completa tu primera sesión de estudio.', icon: '🎬', xp: 100, condition: 'first-session' },
  { id: 'ach_2', name: 'Streak Week', description: '7 días consecutivos de estudio.', icon: '🔥', xp: 150, condition: 'streak-7' },
  { id: 'ach_3', name: '100 Hours', description: 'Acumula 100 horas de estudio.', icon: '⏱️', xp: 300, condition: 'hours-100' },
  { id: 'ach_4', name: 'Perfect Day', description: 'Completa todos los bloques del día (gym, estudio, salud).', icon: '✨', xp: 200 },
  { id: 'ach_5', name: 'Algorithm Master', description: 'Completa todos los temas de AED.', icon: '🧮', xp: 400 },
  { id: 'ach_6', name: 'Cloud Warrior', description: 'Completa todos los temas de Cloud Computing.', icon: '☁️', xp: 300 },
  { id: 'ach_7', name: 'ML Specialist', description: 'Completa todos los temas de Machine Learning.', icon: '🤖', xp: 350 },
  { id: 'ach_8', name: "All A's", description: 'Aprueba con A los 6 cursos.', icon: '🏆', xp: 500 },
  { id: 'ach_9', name: 'GitHub Hero', description: '50+ commits en proyectos personales.', icon: '🐙', xp: 250 },
  { id: 'ach_10', name: 'Community Builder', description: 'Ayuda a 5+ compañeros.', icon: '🤝', xp: 200 },
  { id: 'ach_11', name: 'Iron Programmer', description: 'Mantén una racha de 30 días.', icon: '🦾', xp: 400, condition: 'streak-30' },
  { id: 'ach_12', name: 'Legend', description: 'Alcanza el Nivel 10 · Master Architect.', icon: '👑', xp: 500, condition: 'level-10' },
]

export default achievements
