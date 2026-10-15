/** Pestañas de la app, en orden. Las usan la barra lateral y la barra inferior móvil. */
export const NAV_LINKS = [
  { to: '/', label: 'Inicio', icon: '🏠', end: true, mobile: true },
  { to: '/plan', label: 'Plan', icon: '🎯' },
  { to: '/estudios', label: 'Estudios', icon: '🎓' },
  { to: '/agenda', label: 'Agenda', icon: '📅', mobile: true },
  { to: '/objetivos', label: 'Objetivos', icon: '📆', mobile: true },
  { to: '/proyectos', label: 'Proyectos', icon: '🚀' },
  { to: '/bienestar', label: 'Bienestar', icon: '💚' },
  { to: '/finanzas', label: 'Finanzas', icon: '💰', mobile: true },
  { to: '/revision', label: 'Revisión', icon: '🧭', mobile: true },
] as const

/** Rutas anteriores → nuevas, para no romper enlaces guardados. */
export const LEGACY_ROUTES: Record<string, string> = {
  '/roadmap': '/estudios',
  '/study': '/agenda',
  '/metas': '/objetivos',
  '/streakstudy': '/proyectos',
  '/health': '/bienestar',
  '/journal': '/finanzas',
  '/review': '/revision',
  '/career': '/plan',
}
