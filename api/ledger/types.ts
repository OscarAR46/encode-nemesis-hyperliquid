export interface TradeParams {
  user: string
  coin?: string
  fromMs?: number
  toMs?: number
  builderOnly?: boolean
}

export interface PositionParams {
  user: string
  coin?: string
  fromMs?: number
  toMs?: number
  builderOnly?: boolean
}

export interface PnLParams {
  user: string
  coin?: string
  fromMs?: number
  toMs?: number
  builderOnly?: boolean
  maxStartCapital?: number
}

export interface LeaderboardParams {
  coin?: string
  fromMs?: number
  toMs?: number
  metric: LeaderboardMetric
  builderOnly?: boolean
  maxStartCapital?: number
  limit?: number
}

export type LeaderboardMetric = 'volume' | 'pnl' | 'returnPct'

export interface Trade {
  timeMs: number
  coin: string
  side: 'buy' | 'sell'
  px: number
  sz: number
  fee: number
  closedPnl: number
  builder: string | null
  direction: TradeDirection
  hash: string
  oid: number
  tid: number
  liquidation: LiquidationType | null
  crossed: boolean
}

export type TradeDirection = 
  | 'Open Long'
  | 'Open Short'
  | 'Close Long'
  | 'Close Short'
  | 'Increase Long'
  | 'Increase Short'
  | 'Reduce Long'
  | 'Reduce Short'

export type LiquidationType = 'full' | 'partial' | null

export interface PositionState {
  timeMs: number
  netSize: number
  avgEntryPx: number
  tainted: boolean
  coin: string
  unrealizedPnl: number
  realizedPnl: number
  lifecycleId: number
  liqPx: number | null
  marginUsed: number | null
}

export interface PnLData {
  realizedPnl: number
  returnPct: number
  feesPaid: number
  tradeCount: number
  tainted: boolean
  user: string
  coin: string | null
  fromMs: number | null
  toMs: number | null
  unrealizedPnl: number
  totalPnl: number
  fundingPaid: number
  volume: number
  winCount: number
  lossCount: number
  winRate: number
  largestWin: number
  largestLoss: number
  avgWin: number
  avgLoss: number
  profitFactor: number
  effectiveCapital: number
}

export interface LeaderboardEntry {
  rank: number
  user: string
  metricValue: number
  tradeCount: number
  tainted: boolean
  metricName: LeaderboardMetric
  volume: number
  realizedPnl: number
  returnPct: number
  winRate: number
}

export interface RawHyperliquidFill {
  coin: string
  px: string
  sz: string
  side: 'B' | 'A'
  time: number
  startPosition: string
  dir: string
  closedPnl: string
  hash: string
  oid: number
  crossed: boolean
  fee: string
  tid: number
  liquidation?: {
    liquidatedUser: string
    markPx: string
    method: 'market' | 'backstop'
  } | null
  feeToken?: string
  builderFee?: string
  builder?: string | null
}

export interface RawHyperliquidFunding {
  time: number
  coin: string
  usdc: string
  szi: string
  fundingRate: string
}

export interface RawClearinghouseState {
  assetPositions: Array<{
    position: {
      coin: string
      szi: string
      entryPx: string
      positionValue: string
      unrealizedPnl: string
      returnOnEquity: string
      liquidationPx: string | null
      marginUsed: string
      maxLeverage: number
      cumFunding: {
        allTime: string
        sinceOpen: string
        sinceChange: string
      }
    }
    type: 'oneWay'
  }>
  crossMarginSummary: {
    accountValue: string
    totalNtlPos: string
    totalRawUsd: string
    totalMarginUsed: string
  }
  marginSummary: {
    accountValue: string
    totalNtlPos: string
    totalRawUsd: string
    totalMarginUsed: string
  }
  withdrawable: string
  time: number
}

export interface RawAllMids {
  [coin: string]: string
}

export interface PositionLifecycle {
  id: number
  coin: string
  startTime: number
  endTime: number | null
  trades: Trade[]
  hasBuilderTrades: boolean
  hasNonBuilderTrades: boolean
  realizedPnl: number
  feesPaid: number
}

export interface UserEquitySnapshot {
  timeMs: number
  equity: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  timestamp: number
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number
  offset: number
  limit: number
  hasMore: boolean
}

export interface LedgerConfig {
  hyperliquidInfoUrl: string
  targetBuilder: string | null
  trackedUsers: string[]
  cacheTtlMs: number
  maxLeaderboardSize: number
}

export const DEFAULT_CONFIG: LedgerConfig = {
  hyperliquidInfoUrl: 'https://api.hyperliquid.xyz/info',
  targetBuilder: process.env.TARGET_BUILDER || null,
  trackedUsers: (process.env.TRACKED_USERS || '').split(',').filter(Boolean),
  cacheTtlMs: 60_000,
  maxLeaderboardSize: 100,
}
