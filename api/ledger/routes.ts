/**
 * Ledger API HTTP Routes
 * Handlers for the four required endpoints
 */

import { getOrCreateDatasource } from './datasource'
import type {
  TradeParams,
  PositionParams,
  PnLParams,
  LeaderboardParams,
  LeaderboardMetric,
  ApiResponse,
} from './types'

// =============================================================================
// Query Parameter Parsing
// =============================================================================

function parseQueryParams(url: URL): Record<string, string | undefined> {
  const params: Record<string, string | undefined> = {}
  url.searchParams.forEach((value, key) => {
    params[key] = value
  })
  return params
}

function parseBoolean(value: string | undefined, defaultValue = false): boolean {
  if (value === undefined) return defaultValue
  return value === 'true' || value === '1'
}

function parseInt(value: string | undefined): number | undefined {
  if (value === undefined) return undefined
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? undefined : parsed
}

function parseFloat(value: string | undefined): number | undefined {
  if (value === undefined) return undefined
  const parsed = Number.parseFloat(value)
  return Number.isNaN(parsed) ? undefined : parsed
}

// =============================================================================
// Response Helpers
// =============================================================================

function jsonResponse<T>(data: T, status = 200): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: Date.now(),
  }
  return Response.json(response, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

function errorResponse(message: string, status = 400): Response {
  const response: ApiResponse<null> = {
    success: false,
    error: message,
    timestamp: Date.now(),
  }
  return Response.json(response, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

// =============================================================================
// Route Handlers
// =============================================================================

/**
 * GET /v1/trades
 * 
 * Query params:
 * - user (required): Wallet address
 * - coin (optional): Filter by coin symbol
 * - fromMs (optional): Start timestamp in milliseconds
 * - toMs (optional): End timestamp in milliseconds
 * - builderOnly (optional): Only include builder-attributed trades
 */
export async function handleTrades(url: URL): Promise<Response> {
  const params = parseQueryParams(url)
  
  // Validate required params
  if (!params.user) {
    return errorResponse('user parameter is required', 400)
  }
  
  // Validate address format (basic check)
  if (!params.user.match(/^0x[a-fA-F0-9]{40}$/)) {
    return errorResponse('Invalid user address format. Expected 0x followed by 40 hex characters.', 400)
  }
  
  try {
    const datasource = await getOrCreateDatasource()
    
    const tradeParams: TradeParams = {
      user: params.user,
      coin: params.coin,
      fromMs: parseInt(params.fromMs),
      toMs: parseInt(params.toMs),
      builderOnly: parseBoolean(params.builderOnly),
    }
    
    const trades = await datasource.getTrades(tradeParams)
    
    return jsonResponse(trades)
  } catch (error) {
    console.error('[Ledger API] /v1/trades error:', error)
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    )
  }
}

/**
 * GET /v1/positions/history
 * 
 * Query params:
 * - user (required): Wallet address
 * - coin (optional): Filter by coin symbol
 * - fromMs (optional): Start timestamp in milliseconds
 * - toMs (optional): End timestamp in milliseconds
 * - builderOnly (optional): Only include builder-attributed positions
 */
export async function handlePositionHistory(url: URL): Promise<Response> {
  const params = parseQueryParams(url)
  
  // Validate required params
  if (!params.user) {
    return errorResponse('user parameter is required', 400)
  }
  
  // Validate address format
  if (!params.user.match(/^0x[a-fA-F0-9]{40}$/)) {
    return errorResponse('Invalid user address format. Expected 0x followed by 40 hex characters.', 400)
  }
  
  try {
    const datasource = await getOrCreateDatasource()
    
    const positionParams: PositionParams = {
      user: params.user,
      coin: params.coin,
      fromMs: parseInt(params.fromMs),
      toMs: parseInt(params.toMs),
      builderOnly: parseBoolean(params.builderOnly),
    }
    
    const positions = await datasource.getPositionHistory(positionParams)
    
    return jsonResponse(positions)
  } catch (error) {
    console.error('[Ledger API] /v1/positions/history error:', error)
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    )
  }
}

/**
 * GET /v1/pnl
 * 
 * Query params:
 * - user (required): Wallet address
 * - coin (optional): Filter by coin symbol
 * - fromMs (optional): Start timestamp in milliseconds
 * - toMs (optional): End timestamp in milliseconds
 * - builderOnly (optional): Only include builder-attributed trades
 * - maxStartCapital (optional): Cap for relative return calculation
 */
export async function handlePnL(url: URL): Promise<Response> {
  const params = parseQueryParams(url)
  
  // Validate required params
  if (!params.user) {
    return errorResponse('user parameter is required', 400)
  }
  
  // Validate address format
  if (!params.user.match(/^0x[a-fA-F0-9]{40}$/)) {
    return errorResponse('Invalid user address format. Expected 0x followed by 40 hex characters.', 400)
  }
  
  try {
    const datasource = await getOrCreateDatasource()
    
    const pnlParams: PnLParams = {
      user: params.user,
      coin: params.coin,
      fromMs: parseInt(params.fromMs),
      toMs: parseInt(params.toMs),
      builderOnly: parseBoolean(params.builderOnly),
      maxStartCapital: parseFloat(params.maxStartCapital),
    }
    
    const pnl = await datasource.getPnL(pnlParams)
    
    return jsonResponse(pnl)
  } catch (error) {
    console.error('[Ledger API] /v1/pnl error:', error)
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    )
  }
}

/**
 * GET /v1/leaderboard
 * 
 * Query params:
 * - coin (optional): Filter by coin symbol
 * - fromMs (optional): Start timestamp in milliseconds
 * - toMs (optional): End timestamp in milliseconds
 * - metric (required): Ranking metric - 'volume' | 'pnl' | 'returnPct'
 * - builderOnly (optional): Only include builder-attributed trades (default: true for leaderboard)
 * - maxStartCapital (optional): Cap for relative return calculation
 * - limit (optional): Maximum entries to return (default: 100)
 */
export async function handleLeaderboard(url: URL): Promise<Response> {
  const params = parseQueryParams(url)
  
  // Validate metric
  const validMetrics: LeaderboardMetric[] = ['volume', 'pnl', 'returnPct']
  const metric = (params.metric as LeaderboardMetric) || 'pnl'
  
  if (!validMetrics.includes(metric)) {
    return errorResponse(
      `Invalid metric. Must be one of: ${validMetrics.join(', ')}`,
      400
    )
  }
  
  try {
    const datasource = await getOrCreateDatasource()
    
    const leaderboardParams: LeaderboardParams = {
      coin: params.coin,
      fromMs: parseInt(params.fromMs),
      toMs: parseInt(params.toMs),
      metric,
      builderOnly: parseBoolean(params.builderOnly, true), // Default true for leaderboard
      maxStartCapital: parseFloat(params.maxStartCapital),
      limit: parseInt(params.limit),
    }
    
    const leaderboard = await datasource.getLeaderboard(leaderboardParams)
    
    return jsonResponse(leaderboard)
  } catch (error) {
    console.error('[Ledger API] /v1/leaderboard error:', error)
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    )
  }
}

/**
 * GET /v1/health
 * 
 * Health check endpoint for the Ledger API
 */
export async function handleLedgerHealth(): Promise<Response> {
  try {
    const datasource = await getOrCreateDatasource()
    const health = await datasource.healthCheck()
    
    return jsonResponse({
      service: 'ledger-api',
      datasource: datasource.name,
      ...health,
    }, health.healthy ? 200 : 503)
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : 'Health check failed',
      503
    )
  }
}

// =============================================================================
// Route Registration
// =============================================================================

/**
 * Handle ledger API routes
 * Returns Response if route matches, null otherwise
 */
export async function handleLedgerRoutes(path: string, url: URL): Promise<Response | null> {
  switch (path) {
    case '/v1/trades':
      return handleTrades(url)
    
    case '/v1/positions/history':
      return handlePositionHistory(url)
    
    case '/v1/pnl':
      return handlePnL(url)
    
    case '/v1/leaderboard':
      return handleLeaderboard(url)
    
    case '/v1/health':
      return handleLedgerHealth()
    
    default:
      return null
  }
}

/**
 * Handle CORS preflight requests for Ledger API
 */
export function handleCorsPreflightForLedger(path: string): Response | null {
  if (!path.startsWith('/v1/')) return null
  
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  })
}
