import { format } from 'date-fns'

/** Claves de localStorage que componen todo el estado de la app. */
export const STORE_KEYS = [
  'user-store',
  'course-store',
  'gamification-store',
  'project-store',
  'career-store',
] as const

const APP_MARKER = 'personal-os'

interface BackupFile {
  __app: string
  __version: number
  exportedAt: string
  stores: Record<string, unknown>
}

/** Recolecta todos los stores y descarga un archivo JSON de respaldo. */
export function exportData(): string {
  const stores: Record<string, unknown> = {}
  for (const key of STORE_KEYS) {
    const raw = localStorage.getItem(key)
    if (raw) {
      try {
        stores[key] = JSON.parse(raw)
      } catch {
        stores[key] = raw
      }
    }
  }

  const payload: BackupFile = {
    __app: APP_MARKER,
    __version: 1,
    exportedAt: new Date().toISOString(),
    stores,
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const filename = `personal-os-backup-${format(new Date(), 'yyyy-MM-dd')}.json`
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  return filename
}

/**
 * Lee un archivo de respaldo, valida el formato y restaura los stores.
 * Lanza Error con mensaje legible si el archivo no es válido.
 */
export async function importData(file: File): Promise<void> {
  let parsed: unknown
  try {
    parsed = JSON.parse(await file.text())
  } catch {
    throw new Error('El archivo no es un JSON válido.')
  }

  const backup = parsed as Partial<BackupFile>
  if (!backup || backup.__app !== APP_MARKER || typeof backup.stores !== 'object') {
    throw new Error('Este archivo no es un respaldo de Personal OS.')
  }

  const stores = backup.stores as Record<string, unknown>
  const validKeys = Object.keys(stores).filter((k) =>
    (STORE_KEYS as readonly string[]).includes(k),
  )
  if (validKeys.length === 0) {
    throw new Error('El respaldo no contiene datos reconocibles.')
  }

  // Limpia el estado actual y restaura solo las claves conocidas.
  for (const key of STORE_KEYS) localStorage.removeItem(key)
  for (const key of validKeys) {
    localStorage.setItem(key, JSON.stringify(stores[key]))
  }
}
