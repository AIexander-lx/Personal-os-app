/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** OAuth Client ID de Google Cloud Console (público, no es secreto). */
  readonly VITE_GOOGLE_CLIENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
