export type TradeDirection = 'long' | 'short'
export type TradeAccount = 'demo' | 'real'

/** Una operación del diario de trading. */
export interface Trade {
  id: string
  /** Fecha y hora local de entrada, "yyyy-MM-ddTHH:mm". */
  date: string
  /** Par o activo, p. ej. EURUSD o XAUUSD. */
  pair: string
  direction: TradeDirection
  account: TradeAccount
  entry: number
  stopLoss: number
  /** Precio de salida; null mientras la operación sigue abierta. */
  exit: number | null
  /** Ganancia o pérdida en USD (opcional, se escribe a mano). */
  pnlUsd: number | null
  /** ¿Se respetaron las reglas del plan en esta operación? */
  followedRules: boolean
  /** Por qué entré. */
  reason: string
  /** Lección o comentario al cerrar (opcional). */
  lesson?: string
  createdAt: string // ISO
}

export type TradeInput = Omit<Trade, 'id' | 'createdAt'>
