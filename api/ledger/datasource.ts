/**
 * Datasource Interface
 * Abstract interface for swappable data implementations
 * Satisfies Insilico track requirement for datasource abstraction
 */

import type {
  Trade,
  TradeParams,
  PositionState,
  PositionParams,
  PnLData,
  PnLParams,
  LeaderboardEntry,
  LeaderboardParams,
  UserEquitySnapshot,
  RawAllMids,
} from './types'

/**
 * Abstract datasource interface
 * Both Hyperliquid and future Insilico-HL implementations must satisfy this
 */
export interface Datasource {
  readonly name: string
  
  /**
   * Get trades for a user with optional filters
   */
  getTrades(params: TradeParams): Promise<Trade[]>
  
  /**
   * Reconstruct position history from trades
   */
  getPositionHistory(params: PositionParams): Promise<PositionState[]>
  
  /**
   * Calculate P&L metrics for a user
   */
  getPnL(params: PnLParams): Promise<PnLData>
  
  /**
   * Get leaderboard ranked by specified metric
   */
  getLeaderboard(params: LeaderboardParams): Promise<LeaderboardEntry[]>
  
  /**
   * Get user's equity at a specific time (or current if not specified)
   */
  getUserEquity(user: string, atTimeMs?: number): Promise<number>
  
  /**
   * Get current mid prices for all assets
   */
  getCurrentPrices(): Promise<RawAllMids>
  
  /**
   * Get list of tracked users for leaderboard
   */
  getTrackedUsers(): Promise<string[]>
  
  /**
   * Health check for the datasource
   */
  healthCheck(): Promise<{ healthy: boolean; latencyMs: number; message?: string }>
}

/**
 * Datasource type identifier
 */
export type DatasourceType = 'hyperliquid' | 'insilico'

/**
 * Registry of datasource implementations
 */
const datasourceRegistry = new Map<DatasourceType, () => Promise<Datasource>>()

/**
 * Register a datasource implementation
 */
export function registerDatasource(
  type: DatasourceType,
  factory: () => Promise<Datasource>
): void {
  datasourceRegistry.set(type, factory)
}

/**
 * Get datasource instance by type
 */
export async function getDatasource(type?: DatasourceType): Promise<Datasource> {
  const resolvedType = type || getDatasourceType()
  const factory = datasourceRegistry.get(resolvedType)
  
  if (!factory) {
    throw new Error(`Datasource '${resolvedType}' not registered. Available: ${Array.from(datasourceRegistry.keys()).join(', ')}`)
  }
  
  return factory()
}

/**
 * Get datasource type from environment
 */
export function getDatasourceType(): DatasourceType {
  const envType = process.env.DATASOURCE_TYPE as DatasourceType | undefined
  return envType || 'hyperliquid'
}

/**
 * Singleton instance cache
 */
let cachedDatasource: Datasource | null = null
let cachedType: DatasourceType | null = null

/**
 * Get or create singleton datasource instance
 */
export async function getOrCreateDatasource(): Promise<Datasource> {
  const type = getDatasourceType()
  
  if (cachedDatasource && cachedType === type) {
    return cachedDatasource
  }
  
  cachedDatasource = await getDatasource(type)
  cachedType = type
  
  return cachedDatasource
}

/**
 * Clear cached datasource (for testing)
 */
export function clearDatasourceCache(): void {
  cachedDatasource = null
  cachedType = null
}

/**
 * Initialize default datasources
 * Called on module load
 */
export async function initializeDatasources(): Promise<void> {
  // Register Hyperliquid datasource (lazy import to avoid circular deps)
  registerDatasource('hyperliquid', async () => {
    const { HyperliquidDatasource } = await import('./hyperliquid')
    return new HyperliquidDatasource()
  })
  
  // Register Insilico datasource (placeholder for future)
  registerDatasource('insilico', async () => {
    // When Insilico provides their API, implement InsilicoDatasource
    // For now, fall back to Hyperliquid
    console.warn('[Datasource] Insilico datasource not yet implemented, using Hyperliquid')
    const { HyperliquidDatasource } = await import('./hyperliquid')
    return new HyperliquidDatasource()
  })
}

// Auto-initialize on module load
initializeDatasources()
