/**
 * Integración de solo lectura con Google Calendar.
 *
 * Usa Google Identity Services (GIS) para OAuth en el navegador (sin backend):
 * el usuario autoriza una vez, obtenemos un access token efímero (~1h) y lo
 * usamos para leer eventos vía la API REST de Calendar. El token se guarda en
 * sessionStorage (no localStorage): si expira o se cierra la pestaña, se pide
 * uno nuevo de forma silenciosa (sin popup) si el usuario ya dio permiso antes.
 *
 * Requiere un OAuth Client ID de Google Cloud Console (ver .env.example).
 */

const GIS_SRC = 'https://accounts.google.com/gsi/client'
const SCOPE = 'https://www.googleapis.com/auth/calendar.readonly'
const TOKEN_STORAGE_KEY = 'gcal_token'

interface TokenResponse {
  access_token: string
  expires_in: number
  error?: string
  error_description?: string
}

interface TokenClient {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void
}

// GIS se carga como script global; no hay @types oficiales para este shape mínimo.
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (resp: TokenResponse) => void
            error_callback?: (err: { type: string }) => void
          }) => TokenClient
          revoke: (token: string, done?: () => void) => void
        }
      }
    }
  }
}

let gisPromise: Promise<void> | null = null

function loadGis(): Promise<void> {
  if (gisPromise) return gisPromise
  gisPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve()
      return
    }
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('No se pudo cargar Google Identity Services')))
      return
    }
    const script = document.createElement('script')
    script.src = GIS_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('No se pudo cargar Google Identity Services'))
    document.head.appendChild(script)
  })
  return gisPromise
}

interface StoredToken {
  access_token: string
  expires_at: number
}

function readStoredToken(): StoredToken | null {
  try {
    const raw = sessionStorage.getItem(TOKEN_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredToken
    if (!parsed.access_token || parsed.expires_at <= Date.now()) return null
    return parsed
  } catch {
    return null
  }
}

function storeToken(token: StoredToken) {
  sessionStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(token))
}

function clearStoredToken() {
  sessionStorage.removeItem(TOKEN_STORAGE_KEY)
}

export function isConnected(): boolean {
  return readStoredToken() !== null
}

/**
 * Pide un access token válido. Si `silent` es true, intenta sin mostrar
 * popup (solo funciona si el usuario ya autorizó antes en este navegador).
 */
export async function requestAccessToken(clientId: string, silent: boolean): Promise<string> {
  const cached = readStoredToken()
  if (cached) return cached.access_token

  await loadGis()
  return new Promise((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: (resp) => {
        if (resp.error || !resp.access_token) {
          reject(new Error(resp.error_description ?? resp.error ?? 'No se obtuvo el token de acceso.'))
          return
        }
        // Restamos un margen de 60s para refrescar antes de que el token expire de verdad.
        storeToken({ access_token: resp.access_token, expires_at: Date.now() + (resp.expires_in - 60) * 1000 })
        resolve(resp.access_token)
      },
      error_callback: (err) => {
        reject(new Error(silent ? 'Sin sesión previa de Google.' : `No se pudo conectar: ${err.type}`))
      },
    })
    client.requestAccessToken(silent ? { prompt: '' } : undefined)
  })
}

/** Revoca el token y olvida la sesión local. */
export function disconnect() {
  const cached = readStoredToken()
  clearStoredToken()
  if (cached && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(cached.access_token)
  }
}

export interface GCalCalendar {
  id: string
  summary: string
  primary?: boolean
}

export interface GCalEvent {
  id: string
  summary: string
  description?: string
  location?: string
  /** ISO datetime, o "YYYY-MM-DD" si `allDay`. */
  start: string
  end: string
  allDay: boolean
  htmlLink: string
}

interface RawCalendarListItem {
  id: string
  summary: string
  primary?: boolean
}

interface RawEvent {
  id: string
  summary?: string
  description?: string
  location?: string
  htmlLink: string
  start?: { dateTime?: string; date?: string }
  end?: { dateTime?: string; date?: string }
}

async function apiFetch<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`https://www.googleapis.com/calendar/v3/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 401) {
    clearStoredToken()
    throw new Error('Tu sesión de Google expiró. Reconéctate.')
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null
    throw new Error(body?.error?.message ?? `Error de Google Calendar (HTTP ${res.status}).`)
  }
  return res.json() as Promise<T>
}

/** Lista los calendarios a los que el usuario tiene acceso de lectura. */
export async function listCalendars(token: string): Promise<GCalCalendar[]> {
  const data = await apiFetch<{ items?: RawCalendarListItem[] }>(
    'users/me/calendarList?minAccessRole=reader&maxResults=50',
    token,
  )
  return (data.items ?? []).map((c) => ({ id: c.id, summary: c.summary, primary: c.primary }))
}

/** Lista eventos de un calendario entre dos fechas, ordenados por inicio. */
export async function listEvents(
  token: string,
  calendarId: string,
  timeMin: Date,
  timeMax: Date,
): Promise<GCalEvent[]> {
  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    // Un mes de clases con 6 cursos supera holgadamente los 100 eventos.
    maxResults: '250',
  })
  const data = await apiFetch<{ items?: RawEvent[] }>(
    `calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
    token,
  )
  return (data.items ?? []).map((e) => ({
    id: e.id,
    summary: e.summary ?? '(sin título)',
    description: e.description,
    location: e.location,
    start: e.start?.dateTime ?? e.start?.date ?? timeMin.toISOString(),
    end: e.end?.dateTime ?? e.end?.date ?? timeMax.toISOString(),
    allDay: !e.start?.dateTime,
    htmlLink: e.htmlLink,
  }))
}
