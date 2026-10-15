import { isToday, parseISO } from 'date-fns'
import type { GCalEvent } from './googleCalendar'

export type EventStatus = 'done' | 'current' | 'upcoming'

export interface EnrichedEvent extends GCalEvent {
  status: EventStatus
  isEval: boolean
}

/** Palabras clave para resaltar evaluaciones entre el resto de eventos del curso. */
const EVAL_KEYWORDS = [
  'examen',
  'parcial',
  'evaluaci',
  'sustitutorio',
  'final',
  'pc1',
  'pc2',
  'pc3',
  'pc4',
  'ec1',
  'ec2',
  'ec3',
  'práctica calificada',
  'practica calificada',
]

export function looksLikeEvaluation(e: GCalEvent): boolean {
  const text = `${e.summary} ${e.description ?? ''}`.toLowerCase()
  return EVAL_KEYWORDS.some((k) => text.includes(k))
}

/** Añade estado en vivo (hecho/ahora/próximo) e indicador de evaluación a un evento crudo. */
export function enrich(e: GCalEvent, now: Date): EnrichedEvent {
  const isEval = looksLikeEvaluation(e)
  if (e.allDay) {
    return { ...e, isEval, status: isToday(parseISO(e.start)) ? 'current' : 'upcoming' }
  }
  const start = parseISO(e.start)
  const end = parseISO(e.end)
  let status: EventStatus = 'upcoming'
  if (now >= end) status = 'done'
  else if (now >= start) status = 'current'
  return { ...e, isEval, status }
}

export interface EventColor {
  border: string
  bg: string
  text: string
  dot: string
  ring: string
}

/**
 * Paleta por curso/evento: evita el acento global y el ámbar (reservado para
 * evaluaciones) para que ambas señales de color no se mezclen.
 */
const COLOR_PALETTE: EventColor[] = [
  { border: 'border-sky-500', bg: 'bg-sky-500/15', text: 'text-sky-700 dark:text-sky-300', dot: 'bg-sky-500', ring: 'ring-sky-500/30' },
  { border: 'border-violet-500', bg: 'bg-violet-500/15', text: 'text-violet-700 dark:text-violet-300', dot: 'bg-violet-500', ring: 'ring-violet-500/30' },
  { border: 'border-pink-500', bg: 'bg-pink-500/15', text: 'text-pink-700 dark:text-pink-300', dot: 'bg-pink-500', ring: 'ring-pink-500/30' },
  { border: 'border-teal-500', bg: 'bg-teal-500/15', text: 'text-teal-700 dark:text-teal-300', dot: 'bg-teal-500', ring: 'ring-teal-500/30' },
  { border: 'border-orange-500', bg: 'bg-orange-500/15', text: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-500', ring: 'ring-orange-500/30' },
  { border: 'border-indigo-500', bg: 'bg-indigo-500/15', text: 'text-indigo-700 dark:text-indigo-300', dot: 'bg-indigo-500', ring: 'ring-indigo-500/30' },
  { border: 'border-fuchsia-500', bg: 'bg-fuchsia-500/15', text: 'text-fuchsia-700 dark:text-fuchsia-300', dot: 'bg-fuchsia-500', ring: 'ring-fuchsia-500/30' },
  { border: 'border-lime-600', bg: 'bg-lime-500/15', text: 'text-lime-700 dark:text-lime-300', dot: 'bg-lime-600', ring: 'ring-lime-500/30' },
]

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

/** Color determinista por título: el mismo curso/evento siempre sale del mismo color. */
export function eventColor(summary: string): EventColor {
  const key = summary.trim().toLowerCase()
  return COLOR_PALETTE[hashString(key) % COLOR_PALETTE.length]
}
