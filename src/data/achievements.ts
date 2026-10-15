import type { Achievement } from '@/types'

export const achievements: Achievement[] = [
  { id: 'ach_5', name: 'Algorithm Master', description: 'Completa todos los temas de AED.', icon: '🧮', xp: 400 },
  { id: 'ach_6', name: 'Cloud Warrior', description: 'Completa todos los temas de Cloud Computing.', icon: '☁️', xp: 300 },
  { id: 'ach_7', name: 'ML Specialist', description: 'Completa todos los temas de Machine Learning.', icon: '🤖', xp: 350 },
  { id: 'ach_8', name: "All A's", description: 'Aprueba con A los 6 cursos.', icon: '🏆', xp: 500 },
  { id: 'ach_9', name: 'GitHub Hero', description: '50+ commits en proyectos personales.', icon: '🐙', xp: 250 },
  { id: 'ach_10', name: 'Community Builder', description: 'Ayuda a 5+ compañeros.', icon: '🤝', xp: 200 },
  { id: 'ach_12', name: 'Legend', description: 'Alcanza el Nivel 10 · Master Architect.', icon: '👑', xp: 500, condition: 'level-10' },
  // Plan Millonario
  { id: 'ach_13', name: 'Primer Cliente', description: 'Primer cliente pagado y entregado.', icon: '💰', xp: 500, condition: 'plan-first-client' },
  { id: 'ach_14', name: 'Plan 90 Días', description: 'Completa todo el checklist de 90 días.', icon: '🏁', xp: 1000, condition: 'plan-90-complete' },
  { id: 'ach_15', name: 'Primera Revisión', description: 'Registra tu primera revisión semanal.', icon: '🧭', xp: 100, condition: 'review-1' },
  { id: 'ach_16', name: 'Constancia', description: 'Registra 4 revisiones semanales.', icon: '📊', xp: 250, condition: 'review-4' },
]

export default achievements
